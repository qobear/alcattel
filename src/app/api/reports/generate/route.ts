import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Generate report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const farmId = searchParams.get('farmId');
    const companyId = searchParams.get('companyId');

    if (!reportType) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
    }

    // Base where condition for tenant access
    const baseWhere = {
      farm: {
        company: {
          tenantId: session.user.tenantId,
          ...(companyId && { id: companyId }),
        },
        ...(farmId && { id: farmId }),
      },
    };

    // Date filter
    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate),
    } : undefined;

    let reportData: any[] = [];
    let filename = '';
    let headers: string[] = [];

    switch (reportType) {
      case 'population':
        const animals = await prisma.animal.findMany({
          where: {
            ...baseWhere,
            ...(searchParams.get('species') && { species: searchParams.get('species') as any }),
            ...(searchParams.get('sex') && { sex: searchParams.get('sex') as any }),
            ...(searchParams.get('status') && { status: searchParams.get('status') as any }),
            ...(dateFilter && { createdAt: dateFilter }),
          },
          include: {
            farm: {
              select: {
                name: true,
                company: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { tagNumber: 'asc' },
        });

        headers = ['Tag Number', 'Species', 'Breed', 'Sex', 'Status', 'Farm', 'Company', 'Registration Date'];
        reportData = animals.map(animal => [
          animal.tagNumber,
          animal.species,
          animal.breed || 'N/A',
          animal.sex,
          animal.status,
          animal.farm.name,
          animal.farm.company.name,
          animal.createdAt.toISOString().split('T')[0],
        ]);
        filename = 'population_report';
        break;

      case 'health':
        const healthEvents = await prisma.healthEvent.findMany({
          where: {
            animal: baseWhere,
            ...(dateFilter && { date: dateFilter }),
            ...(searchParams.get('event_type') && { type: searchParams.get('event_type') as any }),
            ...(searchParams.get('status') && { status: searchParams.get('status') as any }),
          },
          include: {
            animal: {
              select: {
                tagNumber: true,
                species: true,
              },
            },
            createdBy: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        });

        headers = ['Animal ID', 'Species', 'Event Type', 'Date', 'Status', 'Description', 'Operator', 'Cost'];
        reportData = healthEvents.map(event => [
          event.animal.tagNumber,
          event.animal.species,
          event.type,
          event.date.toISOString().split('T')[0],
          event.status,
          event.description || 'N/A',
          event.createdBy.name || 'N/A',
          event.cost || 0,
        ]);
        filename = 'health_report';
        break;

      case 'reproduction':
        const usgRecords = await prisma.reproductionUSG.findMany({
          where: {
            animal: baseWhere,
            ...(dateFilter && { date: dateFilter }),
            ...(searchParams.get('result') && { result: searchParams.get('result') as any }),
          },
          include: {
            animal: {
              select: {
                tagNumber: true,
                species: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        });

        headers = ['Animal ID', 'Species', 'USG Date', 'Result', 'Fetus Age (weeks)', 'Due Date', 'Operator', 'Cost'];
        reportData = usgRecords.map(usg => {
          let dueDate = 'N/A';
          if (usg.result === 'PREGNANT' && usg.fetusAgeWeeks) {
            const due = new Date(usg.date.getTime() + (40 - usg.fetusAgeWeeks) * 7 * 24 * 60 * 60 * 1000);
            dueDate = due.toISOString().split('T')[0];
          }
          
          return [
            usg.animal.tagNumber,
            usg.animal.species,
            usg.date.toISOString().split('T')[0],
            usg.result,
            usg.fetusAgeWeeks || 'N/A',
            dueDate,
            usg.operator || 'N/A',
            usg.cost || 0,
          ];
        });
        filename = 'reproduction_report';
        break;

      case 'production':
        const milkRecords = await prisma.milkYield.findMany({
          where: {
            animal: baseWhere,
            ...(dateFilter && { date: dateFilter }),
          },
          include: {
            animal: {
              select: {
                tagNumber: true,
                species: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        });

        headers = ['Animal ID', 'Species', 'Date', 'Morning Yield (L)', 'Evening Yield (L)', 'Total Yield (L)', 'Quality'];
        reportData = milkRecords.map(record => [
          record.animal.tagNumber,
          record.animal.species,
          record.date.toISOString().split('T')[0],
          record.morningYield || 0,
          record.eveningYield || 0,
          (record.morningYield || 0) + (record.eveningYield || 0),
          record.quality || 'N/A',
        ]);
        filename = 'production_report';
        break;

      case 'growth':
        const measurements = await prisma.measurement.findMany({
          where: {
            animal: baseWhere,
            ...(dateFilter && { date: dateFilter }),
          },
          include: {
            animal: {
              select: {
                tagNumber: true,
                species: true,
              },
            },
          },
          orderBy: [{ animalId: 'asc' }, { date: 'asc' }],
        });

        // Calculate ADG (Average Daily Gain)
        const animalMeasurements = measurements.reduce((acc, measurement) => {
          if (!acc[measurement.animalId]) {
            acc[measurement.animalId] = [];
          }
          acc[measurement.animalId].push(measurement);
          return acc;
        }, {} as Record<string, typeof measurements>);

        headers = ['Animal ID', 'Species', 'Date', 'Weight (kg)', 'Height (cm)', 'Body Length (cm)', 'ADG (g/day)'];
        reportData = measurements.map(measurement => {
          let adg = 'N/A';
          const animalData = animalMeasurements[measurement.animalId];
          const currentIndex = animalData.findIndex(m => m.id === measurement.id);
          
          if (currentIndex > 0 && measurement.weight && animalData[currentIndex - 1].weight) {
            const prevMeasurement = animalData[currentIndex - 1];
            const daysDiff = Math.abs(
              (measurement.date.getTime() - prevMeasurement.date.getTime()) / (24 * 60 * 60 * 1000)
            );
            const weightDiff = measurement.weight - prevMeasurement.weight;
            if (daysDiff > 0) {
              adg = ((weightDiff * 1000) / daysDiff).toFixed(0); // Convert to grams per day
            }
          }

          return [
            measurement.animal.tagNumber,
            measurement.animal.species,
            measurement.date.toISOString().split('T')[0],
            measurement.weight || 'N/A',
            measurement.height || 'N/A',
            measurement.bodyLength || 'N/A',
            adg,
          ];
        });
        filename = 'growth_report';
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Generate the report based on format
    if (format === 'csv') {
      const csvContent = [headers.join(','), ...reportData.map(row => row.join(','))].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = reportData.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      return NextResponse.json({
        data: jsonData,
        metadata: {
          reportType,
          generatedAt: new Date().toISOString(),
          totalRecords: reportData.length,
          filters: Object.fromEntries(searchParams.entries()),
        },
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
