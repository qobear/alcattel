import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema untuk validasi milk yield data
const milkYieldSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  session: z.enum(['MORNING', 'EVENING']),
  liters: z.number().min(0, 'Milk yield must be positive').max(100, 'Milk yield seems unrealistically high'),
  quality: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  notes: z.string().optional(),
  milkerName: z.string().optional(),
});

// GET - Ambil semua milk yield records untuk animal
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
    const session_filter = searchParams.get('session');
    const dateFrom = searchParams.get('from') ? new Date(searchParams.get('from')!) : null;
    const dateTo = searchParams.get('to') ? new Date(searchParams.get('to')!) : null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Cek apakah animal exists, merupakan dairy animal, dan user memiliki akses
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        species: {
          in: ['CATTLE', 'GOAT'], // Hanya sapi dan kambing yang bisa diperah
        },
        farm: {
          company: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!animal) {
      return NextResponse.json({ error: 'Dairy animal not found' }, { status: 404 });
    }

    // Build filter conditions
    const whereConditions: any = {
      animalId,
    };

    if (session_filter) {
      whereConditions.session = session_filter;
    }

    if (dateFrom || dateTo) {
      whereConditions.date = {};
      if (dateFrom) whereConditions.date.gte = dateFrom;
      if (dateTo) whereConditions.date.lte = dateTo;
    }

    const milkYieldRecords = await prisma.milkYield.findMany({
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
    const totalCount = await prisma.milkYield.count({
      where: whereConditions,
    });

    // Calculate statistics
    const totalLiters = milkYieldRecords.reduce((sum, record) => sum + record.liters, 0);
    const averageDaily = milkYieldRecords.length > 0 
      ? totalLiters / Math.max(1, new Set(milkYieldRecords.map(r => r.date.toDateString())).size)
      : 0;

    // Get recent trend (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const recentRecords = await prisma.milkYield.findMany({
      where: {
        animalId,
        date: { gte: sevenDaysAgo },
      },
    });

    const previousRecords = await prisma.milkYield.findMany({
      where: {
        animalId,
        date: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    const recentAverage = recentRecords.length > 0 
      ? recentRecords.reduce((sum, r) => sum + r.liters, 0) / recentRecords.length 
      : 0;
    const previousAverage = previousRecords.length > 0 
      ? previousRecords.reduce((sum, r) => sum + r.liters, 0) / previousRecords.length 
      : 0;

    const trend = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;

    return NextResponse.json({
      data: milkYieldRecords,
      statistics: {
        totalRecords: totalCount,
        totalLiters,
        averageDaily,
        recentAverage,
        trend: Math.round(trend * 100) / 100, // Round to 2 decimal places
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching milk yield records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tambah milk yield record baru
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
    const validatedData = milkYieldSchema.parse(body);

    // Cek apakah animal exists, merupakan dairy animal, dan user memiliki akses
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        species: {
          in: ['CATTLE', 'GOAT'],
        },
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
      return NextResponse.json({ error: 'Dairy animal not found' }, { status: 404 });
    }

    // Business rule validations
    const now = new Date();
    if (validatedData.date > now) {
      return NextResponse.json(
        { error: 'Milk yield date cannot be in the future' },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada record untuk tanggal dan session yang sama
    const existingRecord = await prisma.milkYield.findFirst({
      where: {
        animalId,
        date: validatedData.date,
        session: validatedData.session,
      },
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Milk yield record already exists for this date and session' },
        { status: 400 }
      );
    }

    // Validasi business logic - production limit check
    const dailyRecords = await prisma.milkYield.findMany({
      where: {
        animalId,
        date: validatedData.date,
      },
    });

    const dailyTotal = dailyRecords.reduce((sum, record) => sum + record.liters, 0) + validatedData.liters;
    
    // Warning jika total harian melebihi batas wajar (misalnya 50L untuk sapi, 10L untuk kambing)
    const maxDaily = animal.species === 'CATTLE' ? 50 : 10;
    if (dailyTotal > maxDaily) {
      return NextResponse.json(
        { error: `Daily total (${dailyTotal}L) exceeds typical maximum for ${animal.species.toLowerCase()} (${maxDaily}L)` },
        { status: 400 }
      );
    }

    // Create milk yield record
    const milkYieldRecord = await prisma.milkYield.create({
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

    return NextResponse.json({
      data: milkYieldRecord,
      message: 'Milk yield record created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating milk yield record:', error);
    
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
