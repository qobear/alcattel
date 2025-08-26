import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema untuk validasi health event
const healthEventSchema = z.object({
  type: z.enum(['VACCINATION', 'TREATMENT', 'CHECKUP', 'SURGERY', 'MEDICATION', 'OBSERVATION']),
  date: z.string().transform((str) => new Date(str)),
  description: z.string().min(1, 'Description is required'),
  veterinarianName: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.string().transform((str) => str ? new Date(str) : null).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('COMPLETED'),
  cost: z.number().optional(),
});

// GET - Ambil semua health events untuk animal
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Cek apakah animal exists dan user memiliki akses
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        farm: {
          company: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    // Build filter conditions
    const whereConditions: any = {
      animalId,
    };

    if (type) {
      whereConditions.type = type;
    }

    if (status) {
      whereConditions.status = status;
    }

    const healthEvents = await prisma.healthEvent.findMany({
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
    const totalCount = await prisma.healthEvent.count({
      where: whereConditions,
    });

    return NextResponse.json({
      data: healthEvents,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching health events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tambah health event baru
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
    const validatedData = healthEventSchema.parse(body);

    // Cek apakah animal exists dan user memiliki akses
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
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
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    // Business rule validations
    const now = new Date();
    if (validatedData.date > now && validatedData.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot mark future events as completed' },
        { status: 400 }
      );
    }

    // Untuk vaksinasi, cek apakah sudah ada vaksinasi yang sama dalam periode tertentu
    if (validatedData.type === 'VACCINATION') {
      const existingVaccination = await prisma.healthEvent.findFirst({
        where: {
          animalId,
          type: 'VACCINATION',
          description: validatedData.description,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 hari terakhir
          },
          status: 'COMPLETED',
        },
      });

      if (existingVaccination) {
        return NextResponse.json(
          { error: 'Similar vaccination already recorded in the last 30 days' },
          { status: 400 }
        );
      }
    }

    // Create health event
    const healthEvent = await prisma.healthEvent.create({
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

    // Update animal's last health check date jika ini adalah checkup
    if (validatedData.type === 'CHECKUP' && validatedData.status === 'COMPLETED') {
      await prisma.animal.update({
        where: { id: animalId },
        data: { lastHealthCheck: validatedData.date },
      });
    }

    return NextResponse.json({
      data: healthEvent,
      message: 'Health event created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating health event:', error);
    
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
