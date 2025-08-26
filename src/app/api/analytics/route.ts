import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '30'; // days
    
    // Date range calculation
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

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

    // 1. Population Overview
    const totalAnimals = await prisma.animal.count({
      where: baseWhere,
    });

    const animalsBySpecies = await prisma.animal.groupBy({
      by: ['species'],
      where: baseWhere,
      _count: {
        id: true,
      },
    });

    const animalsBySex = await prisma.animal.groupBy({
      by: ['sex'],
      where: baseWhere,
      _count: {
        id: true,
      },
    });

    const animalsByStatus = await prisma.animal.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true,
      },
    });

    // 2. Health Metrics
    const totalHealthEvents = await prisma.healthEvent.count({
      where: {
        animal: baseWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const healthEventsByType = await prisma.healthEvent.groupBy({
      by: ['type'],
      where: {
        animal: baseWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    const healthEventsByStatus = await prisma.healthEvent.groupBy({
      by: ['status'],
      where: {
        animal: baseWhere,
      },
      _count: {
        id: true,
      },
    });

    // Overdue health events
    const overdueHealthEvents = await prisma.healthEvent.count({
      where: {
        animal: baseWhere,
        status: 'SCHEDULED',
        date: {
          lt: new Date(),
        },
      },
    });

    // 3. Reproduction Metrics (Female animals only)
    const femaleAnimals = await prisma.animal.count({
      where: {
        ...baseWhere,
        sex: 'FEMALE',
      },
    });

    const pregnantAnimals = await prisma.reproductionUSG.count({
      where: {
        animal: baseWhere,
        result: 'PREGNANT',
        // Get latest USG per animal
        id: {
          in: await prisma.reproductionUSG
            .groupBy({
              by: ['animalId'],
              where: {
                animal: baseWhere,
              },
              _max: {
                date: true,
              },
            })
            .then((groups) =>
              Promise.all(
                groups.map(async (group) => {
                  const latest = await prisma.reproductionUSG.findFirst({
                    where: {
                      animalId: group.animalId,
                      date: group._max.date,
                    },
                    select: { id: true },
                  });
                  return latest?.id;
                })
              )
            )
            .then((ids) => ids.filter(Boolean) as string[])
        },
      },
    });

    const usgResultsDistribution = await prisma.reproductionUSG.groupBy({
      by: ['result'],
      where: {
        animal: baseWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // 4. Milk Production Metrics (Dairy animals only)
    const dairyAnimals = await prisma.animal.count({
      where: {
        ...baseWhere,
        species: {
          in: ['CATTLE', 'GOAT'],
        },
      },
    });

    const milkProductionStats = await prisma.milkYield.aggregate({
      where: {
        animal: baseWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        morningYield: true,
        eveningYield: true,
      },
      _sum: {
        morningYield: true,
        eveningYield: true,
      },
      _count: {
        id: true,
      },
    });

    // Daily milk production trend (last 7 days)
    const milkTrend = await prisma.milkYield.groupBy({
      by: ['date'],
      where: {
        animal: baseWhere,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lte: endDate,
        },
      },
      _sum: {
        morningYield: true,
        eveningYield: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 5. Growth & Measurement Metrics
    const measurementStats = await prisma.measurement.aggregate({
      where: {
        animal: baseWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        weight: true,
        height: true,
        bodyLength: true,
        scrotalCircumference: true,
      },
      _count: {
        id: true,
      },
    });

    // Weight trend (monthly averages for the year)
    const weightTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        AVG(weight) as avg_weight,
        COUNT(*) as measurement_count
      FROM "Measurement" m
      JOIN "Animal" a ON m."animalId" = a.id
      JOIN "Farm" f ON a."farmId" = f.id
      JOIN "Company" c ON f."companyId" = c.id
      WHERE c."tenantId" = ${session.user.tenantId}
        ${farmId ? `AND f.id = ${farmId}` : ''}
        ${companyId ? `AND c.id = ${companyId}` : ''}
        AND m.date >= DATE_TRUNC('year', CURRENT_DATE)
        AND m.weight IS NOT NULL
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `;

    // 6. Recent Activities
    const recentHealthEvents = await prisma.healthEvent.findMany({
      where: {
        animal: baseWhere,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        animal: {
          select: {
            id: true,
            tagNumber: true,
            species: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    const recentMeasurements = await prisma.measurement.findMany({
      where: {
        animal: baseWhere,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        animal: {
          select: {
            id: true,
            tagNumber: true,
            species: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    // 7. Alerts & Notifications
    const alerts = [];

    // Health overdue alerts
    if (overdueHealthEvents > 0) {
      alerts.push({
        type: 'warning',
        category: 'health',
        message: `${overdueHealthEvents} overdue health events`,
        count: overdueHealthEvents,
      });
    }

    // Pregnancy due alerts (animals due within 30 days)
    const dueSoonCount = await prisma.reproductionUSG.count({
      where: {
        animal: baseWhere,
        result: 'PREGNANT',
        date: {
          // Animals that are due within 30 days (assuming 280-day gestation)
          gte: new Date(Date.now() - (280 - 30) * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (dueSoonCount > 0) {
      alerts.push({
        type: 'info',
        category: 'reproduction',
        message: `${dueSoonCount} animals due for calving soon`,
        count: dueSoonCount,
      });
    }

    // Low milk production alert (below average for last 7 days)
    const avgProduction = milkProductionStats._avg.morningYield || 0 + milkProductionStats._avg.eveningYield || 0;
    if (avgProduction > 0 && milkTrend.length > 0) {
      const recentAvg = milkTrend.slice(-3).reduce((sum, day) => 
        sum + (day._sum.morningYield || 0) + (day._sum.eveningYield || 0), 0
      ) / Math.max(milkTrend.slice(-3).length, 1);
      
      if (recentAvg < avgProduction * 0.8) {
        alerts.push({
          type: 'warning',
          category: 'production',
          message: 'Milk production below average',
          details: `Recent: ${recentAvg.toFixed(1)}L vs Avg: ${avgProduction.toFixed(1)}L`,
        });
      }
    }

    return NextResponse.json({
      data: {
        overview: {
          totalAnimals,
          femaleAnimals,
          dairyAnimals,
          pregnantAnimals,
          animalsBySpecies: animalsBySpecies.map(item => ({
            species: item.species,
            count: item._count.id,
          })),
          animalsBySex: animalsBySex.map(item => ({
            sex: item.sex,
            count: item._count.id,
          })),
          animalsByStatus: animalsByStatus.map(item => ({
            status: item.status,
            count: item._count.id,
          })),
        },
        health: {
          totalEvents: totalHealthEvents,
          overdueEvents: overdueHealthEvents,
          eventsByType: healthEventsByType.map(item => ({
            type: item.type,
            count: item._count.id,
          })),
          eventsByStatus: healthEventsByStatus.map(item => ({
            status: item.status,
            count: item._count.id,
          })),
        },
        reproduction: {
          femaleAnimals,
          pregnantAnimals,
          pregnancyRate: femaleAnimals > 0 ? (pregnantAnimals / femaleAnimals * 100).toFixed(1) : '0',
          usgResults: usgResultsDistribution.map(item => ({
            result: item.result,
            count: item._count.id,
          })),
        },
        production: {
          dairyAnimals,
          totalRecords: milkProductionStats._count.id,
          avgDailyYield: ((milkProductionStats._avg.morningYield || 0) + (milkProductionStats._avg.eveningYield || 0)).toFixed(2),
          totalProduction: ((milkProductionStats._sum.morningYield || 0) + (milkProductionStats._sum.eveningYield || 0)).toFixed(2),
          trend: milkTrend.map(item => ({
            date: item.date,
            totalYield: ((item._sum.morningYield || 0) + (item._sum.eveningYield || 0)).toFixed(2),
          })),
        },
        measurements: {
          totalRecords: measurementStats._count.id,
          avgWeight: measurementStats._avg.weight?.toFixed(2) || '0',
          avgHeight: measurementStats._avg.height?.toFixed(2) || '0',
          avgBodyLength: measurementStats._avg.bodyLength?.toFixed(2) || '0',
          weightTrend,
        },
        recentActivity: {
          healthEvents: recentHealthEvents,
          measurements: recentMeasurements,
        },
        alerts,
        period: {
          days: parseInt(period),
          startDate,
          endDate,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
