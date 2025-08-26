import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema untuk validasi USG data
const usgSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  result: z.enum(['PREGNANT', 'EMPTY', 'UNCLEAR']),
  fetusAgeWeeks: z.number().min(0).max(50).optional(),
  operator: z.string().min(1, 'Operator name is required'),
  notes: z.string().optional(),
  nextCheckDate: z.string().transform((str) => str ? new Date(str) : null).optional(),
  cost: z.number().min(0).optional(),
});

// GET - Ambil semua USG records untuk animal
export async function GET(
  request: NextRequest,
  { params }: { params: { animalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const animalId = params.animalId;
    const { searchParams } = new URL(request.url);
    const result = searchParams.get('result');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Cek apakah animal exists, adalah betina, dan user memiliki akses
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        sex: 'FEMALE', // USG hanya untuk betina
        farm: {
          company: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!animal) {
      return NextResponse.json({ error: 'Female animal not found' }, { status: 404 });
    }

    // Build filter conditions
    const whereConditions: any = {
      animalId,
    };

    if (result) {
      whereConditions.result = result;
    }

    const usgRecords = await prisma.reproductionUSG.findMany({
      where: whereConditions,
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get total count untuk pagination
    const totalCount = await prisma.reproductionUSG.count({
      where: whereConditions,
    });

    // Get pregnancy status summary
    const latestUSG = usgRecords[0];
    const isCurrentlyPregnant = latestUSG?.result === 'PREGNANT';
    const estimatedDueDate = isCurrentlyPregnant && latestUSG?.fetusAgeWeeks 
      ? new Date(latestUSG.date.getTime() + (40 - latestUSG.fetusAgeWeeks) * 7 * 24 * 60 * 60 * 1000)
      : null;

    return NextResponse.json({
      data: usgRecords,
      summary: {
        currentStatus: isCurrentlyPregnant ? 'PREGNANT' : 'EMPTY',
        estimatedDueDate,
        lastCheckDate: latestUSG?.date,
        nextCheckDate: latestUSG?.nextCheckDate,
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching USG records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tambah USG record baru
export async function POST(
  request: NextRequest,
  { params }: { params: { animalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const animalId = params.animalId;
    const body = await request.json();

    // Validasi input
    const validatedData = usgSchema.parse(body);

    // Cek apakah animal exists, adalah betina, dan user memiliki akses
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        sex: 'FEMALE',
        farm: {
          company: {
            tenantId: session.user.tenantId,
          },
        },
      },
      include: {
        farm: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!animal) {
      return NextResponse.json({ error: 'Female animal not found' }, { status: 404 });
    }

    // Business rule validations
    const now = new Date();
    if (validatedData.date > now) {
      return NextResponse.json(
        { error: 'USG date cannot be in the future' },
        { status: 400 }
      );
    }

    // Jika result PREGNANT, fetus age wajib diisi
    if (validatedData.result === 'PREGNANT' && !validatedData.fetusAgeWeeks) {
      return NextResponse.json(
        { error: 'Fetus age is required when result is PREGNANT' },
        { status: 400 }
      );
    }

    // Jika result bukan PREGNANT, fetus age tidak boleh diisi
    if (validatedData.result !== 'PREGNANT' && validatedData.fetusAgeWeeks) {
      return NextResponse.json(
        { error: 'Fetus age should only be specified when result is PREGNANT' },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada USG pada tanggal yang sama
    const existingUSG = await prisma.reproductionUSG.findFirst({
      where: {
        animalId,
        date: validatedData.date,
      },
    });

    if (existingUSG) {
      return NextResponse.json(
        { error: 'USG record already exists for this date' },
        { status: 400 }
      );
    }

    // Create USG record
    const usgRecord = await prisma.reproductionUSG.create({
      data: {
        ...validatedData,
        animalId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update animal's reproduction status if pregnant
    if (validatedData.result === 'PREGNANT') {
      await prisma.animal.update({
        where: { id: animalId },
        data: { 
          status: 'ACTIVE', // pastikan status active jika bunting
          // Bisa tambah field lastUSGDate atau pregnancyStatus
        },
      });
    }

    return NextResponse.json({
      data: usgRecord,
      message: 'USG record created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating USG record:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
