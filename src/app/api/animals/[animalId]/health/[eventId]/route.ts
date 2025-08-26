import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema untuk update health event
const updateHealthEventSchema = z.object({
  type: z.enum(['VACCINATION', 'TREATMENT', 'CHECKUP', 'SURGERY', 'MEDICATION', 'OBSERVATION']).optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  description: z.string().min(1, 'Description is required').optional(),
  veterinarianName: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.string().transform((str) => str ? new Date(str) : null).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  cost: z.number().optional(),
});

// GET - Ambil detail health event
export async function GET(
  request: NextRequest,
  { params }: { params: { animalId: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animalId, eventId } = params;

    // Cek apakah health event exists dan user memiliki akses
    const healthEvent = await prisma.healthEvent.findFirst({
      where: {
        id: eventId,
        animalId,
        animal: {
          farm: {
            company: {
              tenantId: session.user.tenantId,
            },
          },
        },
      },
      include: {
        animal: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            species: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!healthEvent) {
      return NextResponse.json({ error: 'Health event not found' }, { status: 404 });
    }

    return NextResponse.json({ data: healthEvent });

  } catch (error) {
    console.error('Error fetching health event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update health event
export async function PUT(
  request: NextRequest,
  { params }: { params: { animalId: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animalId, eventId } = params;
    const body = await request.json();

    // Validasi input
    const validatedData = updateHealthEventSchema.parse(body);

    // Cek apakah health event exists dan user memiliki akses
    const existingHealthEvent = await prisma.healthEvent.findFirst({
      where: {
        id: eventId,
        animalId,
        animal: {
          farm: {
            company: {
              tenantId: session.user.tenantId,
            },
          },
        },
      },
    });

    if (!existingHealthEvent) {
      return NextResponse.json({ error: 'Health event not found' }, { status: 404 });
    }

    // Business rule validations
    if (validatedData.date && validatedData.status === 'COMPLETED') {
      const now = new Date();
      if (validatedData.date > now) {
        return NextResponse.json(
          { error: 'Cannot mark future events as completed' },
          { status: 400 }
        );
      }
    }

    // Update health event
    const updatedHealthEvent = await prisma.healthEvent.update({
      where: { id: eventId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
        updatedById: session.user.id,
      },
      include: {
        animal: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            species: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update animal's last health check date jika ini adalah checkup yang completed
    if (validatedData.type === 'CHECKUP' && validatedData.status === 'COMPLETED' && validatedData.date) {
      await prisma.animal.update({
        where: { id: animalId },
        data: { lastHealthCheck: validatedData.date },
      });
    }

    return NextResponse.json({
      data: updatedHealthEvent,
      message: 'Health event updated successfully',
    });

  } catch (error) {
    console.error('Error updating health event:', error);
    
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

// DELETE - Hapus health event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { animalId: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animalId, eventId } = params;

    // Cek apakah health event exists dan user memiliki akses
    const existingHealthEvent = await prisma.healthEvent.findFirst({
      where: {
        id: eventId,
        animalId,
        animal: {
          farm: {
            company: {
              tenantId: session.user.tenantId,
            },
          },
        },
      },
    });

    if (!existingHealthEvent) {
      return NextResponse.json({ error: 'Health event not found' }, { status: 404 });
    }

    // Business rule: Hanya bisa hapus jika status masih SCHEDULED
    if (existingHealthEvent.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete completed health events' },
        { status: 400 }
      );
    }

    // Hapus health event
    await prisma.healthEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({
      message: 'Health event deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting health event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
