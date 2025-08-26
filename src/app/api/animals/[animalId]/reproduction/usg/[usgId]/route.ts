import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema untuk update USG record
const updateUsgSchema = z.object({
  date: z.string().transform((str) => new Date(str)).optional(),
  result: z.enum(['PREGNANT', 'EMPTY', 'UNCLEAR']).optional(),
  fetusAgeWeeks: z.number().min(0).max(50).optional(),
  operator: z.string().min(1, 'Operator name is required').optional(),
  notes: z.string().optional(),
  nextCheckDate: z.string().transform((str) => str ? new Date(str) : null).optional(),
  cost: z.number().min(0).optional(),
});

// GET - Ambil detail USG record
export async function GET(
  request: NextRequest,
  { params }: { params: { animalId: string; usgId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animalId, usgId } = params;

    // Cek apakah USG record exists dan user memiliki akses
    const usgRecord = await prisma.reproductionUSG.findFirst({
      where: {
        id: usgId,
        animalId,
        animal: {
          sex: 'FEMALE',
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
            species: true,
            breed: true,
            sex: true,
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

    if (!usgRecord) {
      return NextResponse.json({ error: 'USG record not found' }, { status: 404 });
    }

    // Calculate pregnancy information if pregnant
    let pregnancyInfo = null;
    if (usgRecord.result === 'PREGNANT' && usgRecord.fetusAgeWeeks) {
      const estimatedDueDate = new Date(
        usgRecord.date.getTime() + (40 - usgRecord.fetusAgeWeeks) * 7 * 24 * 60 * 60 * 1000
      );
      const daysUntilDue = Math.ceil((estimatedDueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
      
      pregnancyInfo = {
        estimatedDueDate,
        daysUntilDue,
        currentGestationWeeks: usgRecord.fetusAgeWeeks + Math.floor((new Date().getTime() - usgRecord.date.getTime()) / (7 * 24 * 60 * 60 * 1000)),
        trimester: usgRecord.fetusAgeWeeks <= 13 ? 1 : usgRecord.fetusAgeWeeks <= 26 ? 2 : 3,
      };
    }

    return NextResponse.json({ 
      data: usgRecord,
      pregnancyInfo,
    });

  } catch (error) {
    console.error('Error fetching USG record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update USG record
export async function PUT(
  request: NextRequest,
  { params }: { params: { animalId: string; usgId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animalId, usgId } = params;
    const body = await request.json();

    // Validasi input
    const validatedData = updateUsgSchema.parse(body);

    // Cek apakah USG record exists dan user memiliki akses
    const existingUSG = await prisma.reproductionUSG.findFirst({
      where: {
        id: usgId,
        animalId,
        animal: {
          sex: 'FEMALE',
          farm: {
            company: {
              tenantId: session.user.tenantId,
            },
          },
        },
      },
    });

    if (!existingUSG) {
      return NextResponse.json({ error: 'USG record not found' }, { status: 404 });
    }

    // Business rule validations
    if (validatedData.date && validatedData.date > new Date()) {
      return NextResponse.json(
        { error: 'USG date cannot be in the future' },
        { status: 400 }
      );
    }

    // Validasi konsistensi result dan fetus age
    const finalResult = validatedData.result || existingUSG.result;
    const finalFetusAge = validatedData.fetusAgeWeeks !== undefined ? validatedData.fetusAgeWeeks : existingUSG.fetusAgeWeeks;

    if (finalResult === 'PREGNANT' && !finalFetusAge) {
      return NextResponse.json(
        { error: 'Fetus age is required when result is PREGNANT' },
        { status: 400 }
      );
    }

    if (finalResult !== 'PREGNANT' && finalFetusAge) {
      return NextResponse.json(
        { error: 'Fetus age should only be specified when result is PREGNANT' },
        { status: 400 }
      );
    }

    // Update USG record
    const updatedUSG = await prisma.reproductionUSG.update({
      where: { id: usgId },
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
            species: true,
            breed: true,
            sex: true,
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

    return NextResponse.json({
      data: updatedUSG,
      message: 'USG record updated successfully',
    });

  } catch (error) {
    console.error('Error updating USG record:', error);
    
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

// DELETE - Hapus USG record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { animalId: string; usgId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animalId, usgId } = params;

    // Cek apakah USG record exists dan user memiliki akses
    const existingUSG = await prisma.reproductionUSG.findFirst({
      where: {
        id: usgId,
        animalId,
        animal: {
          sex: 'FEMALE',
          farm: {
            company: {
              tenantId: session.user.tenantId,
            },
          },
        },
      },
    });

    if (!existingUSG) {
      return NextResponse.json({ error: 'USG record not found' }, { status: 404 });
    }

    // Business rule: Hanya bisa hapus USG record yang bukan yang terbaru (untuk menjaga integritas data)
    const latestUSG = await prisma.reproductionUSG.findFirst({
      where: { animalId },
      orderBy: { date: 'desc' },
    });

    if (latestUSG?.id === usgId) {
      return NextResponse.json(
        { error: 'Cannot delete the most recent USG record' },
        { status: 400 }
      );
    }

    // Hapus USG record
    await prisma.reproductionUSG.delete({
      where: { id: usgId },
    });

    return NextResponse.json({
      message: 'USG record deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting USG record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
