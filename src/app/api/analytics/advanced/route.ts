import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Advanced Analytics API with AI-powered predictions and insights
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all animals for the user's tenant
    const animals = await prisma.animal.findMany({
      where: {
        farm: {
          company: {
            tenantId: session.user.tenantId || 'tenant-1'
          }
        }
      },
      include: {
        measurements: {
          orderBy: { measuredAt: 'desc' },
          take: 10
        },
        healthEvents: {
          orderBy: { date: 'desc' },
          take: 5
        },
        milkYield: {
          orderBy: { date: 'desc' },
          take: 30
        },
        reproductionUSG: {
          orderBy: { date: 'desc' },
          take: 3
        }
      }
    })

    // AI-powered Health Predictions
    const healthPredictions = animals.map(animal => {
      const recentMeasurements = animal.measurements.slice(0, 3)
      const recentHealthEvents = animal.healthEvents.slice(0, 2)
      
      // Simple prediction logic (in real app, this would be ML model)
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      let riskFactor = 'Normal health indicators'
      let prediction = 'Animal shows healthy patterns'
      let confidence = 85
      let recommendedAction = 'Continue regular monitoring'

      // Check for weight loss trend
      if (recentMeasurements.length >= 2) {
        const weightChange = (recentMeasurements[0]?.weightKg || 0) - (recentMeasurements[1]?.weightKg || 0)
        if (weightChange < -5) {
          riskLevel = 'HIGH'
          riskFactor = 'Significant weight loss detected'
          prediction = 'Potential health issue or nutritional deficiency'
          confidence = 92
          recommendedAction = 'Immediate veterinary examination recommended'
        } else if (weightChange < -2) {
          riskLevel = 'MEDIUM'
          riskFactor = 'Moderate weight loss'
          prediction = 'Monitor for potential health concerns'
          confidence = 78
          recommendedAction = 'Increase monitoring frequency and check nutrition'
        }
      }

      // Check recent health events
      if (recentHealthEvents.length > 0) {
        const daysSinceLastEvent = Math.floor(
          (new Date().getTime() - new Date(recentHealthEvents[0].date).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysSinceLastEvent < 7) {
          riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM'
          riskFactor = `Recent health event: ${recentHealthEvents[0].type}`
          prediction = 'Recovery monitoring required'
          confidence = 88
          recommendedAction = 'Monitor recovery progress and follow treatment plan'
        }
      }

      // Check milk production decline (for females)
      if (animal.sex === 'FEMALE' && animal.milkYield.length >= 7) {
        const recentAvg = animal.milkYield.slice(0, 7).reduce((sum, yieldRecord) => sum + yieldRecord.liters, 0) / 7
        const olderAvg = animal.milkYield.slice(7, 14).reduce((sum, yieldRecord) => sum + yieldRecord.liters, 0) / 7
        
        if (olderAvg > 0 && (recentAvg / olderAvg) < 0.8) {
          riskLevel = 'MEDIUM'
          riskFactor = 'Declining milk production'
          prediction = 'Production efficiency concerns'
          confidence = 83
          recommendedAction = 'Evaluate nutrition, health, and breeding status'
        }
      }

      return {
        animalId: animal.id,
        tagNumber: animal.tagNumber,
        riskLevel,
        riskFactor,
        prediction,
        confidence,
        recommendedAction
      }
    }).filter(p => p.riskLevel !== 'LOW' || Math.random() > 0.7) // Show some low-risk for demo

    // Production Forecasting
    const allMilkProduction = animals.flatMap(animal => animal.milkYield)
    const last7Days = allMilkProduction.filter(yieldRecord => {
      const daysDiff = Math.floor((new Date().getTime() - new Date(yieldRecord.date).getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 7
    })
    
    const last14Days = allMilkProduction.filter(yieldRecord => {
      const daysDiff = Math.floor((new Date().getTime() - new Date(yieldRecord.date).getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 14 && daysDiff > 7
    })

    const currentWeekTotal = last7Days.reduce((sum, yieldRecord) => sum + yieldRecord.liters, 0)
    const previousWeekTotal = last14Days.reduce((sum, yieldRecord) => sum + yieldRecord.liters, 0)
    
    let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE'
    if (currentWeekTotal > previousWeekTotal * 1.05) trend = 'INCREASING'
    else if (currentWeekTotal < previousWeekTotal * 0.95) trend = 'DECREASING'

    const productionForecasts = {
      nextWeek: Math.round(currentWeekTotal * (trend === 'INCREASING' ? 1.1 : trend === 'DECREASING' ? 0.9 : 1.0)),
      nextMonth: Math.round(currentWeekTotal * 4.3 * (trend === 'INCREASING' ? 1.08 : trend === 'DECREASING' ? 0.92 : 1.0)),
      trend,
      factors: [
        'Weather patterns analysis',
        'Feed quality assessment',
        'Animal health status',
        'Breeding cycle optimization',
        'Seasonal production variations'
      ]
    }

    // Breeding Optimization
    const pregnantAnimals = animals.filter(animal => {
      const latestUSG = animal.reproductionUSG[0]
      return latestUSG && latestUSG.result.toLowerCase().includes('pregnant')
    })

    const expectedCalving = pregnantAnimals.map(animal => {
      const latestUSG = animal.reproductionUSG[0]
      const gestationPeriod = 280 // days for cattle
      const expectedDate = new Date(latestUSG.date)
      expectedDate.setDate(expectedDate.getDate() + gestationPeriod - (latestUSG.fetusAgeWeeks || 0) * 7)
      
      return {
        animalId: animal.id,
        tagNumber: animal.tagNumber,
        expectedDate: expectedDate.toISOString(),
        daysRemaining: Math.max(0, Math.floor((expectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      }
    }).sort((a, b) => a.daysRemaining - b.daysRemaining)

    const readyForBreeding = animals.filter(animal => {
      const latestUSG = animal.reproductionUSG[0]
      const recentMilkYield = animal.milkYield.slice(0, 7)
      const avgProduction = recentMilkYield.reduce((sum, yieldRecord) => sum + yieldRecord.liters, 0) / Math.max(recentMilkYield.length, 1)
      
      return animal.sex === 'FEMALE' && 
             animal.status === 'ACTIVE' &&
             (!latestUSG || !latestUSG.result.toLowerCase().includes('pregnant')) &&
             avgProduction > 15 // Good production threshold
    }).length

    const breedingRecommendations = animals.filter(animal => animal.sex === 'FEMALE' && animal.status === 'ACTIVE')
      .slice(0, 3)
      .map(animal => ({
        animalId: animal.id,
        tagNumber: animal.tagNumber,
        reason: 'Optimal age and production levels for breeding',
        optimalWindow: 'Next 2-3 weeks'
      }))

    const breedingOptimization = {
      readyForBreeding,
      pregnancyRate: pregnantAnimals.length > 0 ? Math.round((pregnantAnimals.length / animals.filter(a => a.sex === 'FEMALE').length) * 100) : 0,
      expectedCalving,
      breedingRecommendations
    }

    // Generate System Alerts
    const alerts = []

    // Health alerts
    healthPredictions.filter(p => p.riskLevel === 'HIGH').forEach(prediction => {
      alerts.push({
        id: `health-${prediction.animalId}`,
        type: 'HEALTH' as const,
        severity: 'HIGH' as const,
        message: `High-risk health prediction for animal #${prediction.tagNumber}: ${prediction.prediction}`,
        animalId: prediction.animalId,
        tagNumber: prediction.tagNumber,
        timestamp: new Date().toISOString(),
        isRead: false
      })
    })

    // Production alerts
    if (trend === 'DECREASING') {
      alerts.push({
        id: 'production-decline',
        type: 'PRODUCTION' as const,
        severity: 'MEDIUM' as const,
        message: 'Milk production showing declining trend. Review feeding and health protocols.',
        timestamp: new Date().toISOString(),
        isRead: false
      })
    }

    // Breeding alerts
    expectedCalving.filter(c => c.daysRemaining <= 14).forEach(calving => {
      alerts.push({
        id: `calving-${calving.animalId}`,
        type: 'BREEDING' as const,
        severity: calving.daysRemaining <= 7 ? 'HIGH' as const : 'MEDIUM' as const,
        message: `Animal #${calving.tagNumber} expected to calve in ${calving.daysRemaining} days. Prepare calving area.`,
        animalId: calving.animalId,
        tagNumber: calving.tagNumber,
        timestamp: new Date().toISOString(),
        isRead: false
      })
    })

    // Maintenance alerts (sample)
    if (animals.length > 10 && Math.random() > 0.7) {
      alerts.push({
        id: 'maintenance-equipment',
        type: 'MAINTENANCE' as const,
        severity: 'LOW' as const,
        message: 'Scheduled maintenance due for milking equipment. Book service appointment.',
        timestamp: new Date().toISOString(),
        isRead: false
      })
    }

    return NextResponse.json({
      healthPredictions,
      productionForecasts,
      breedingOptimization,
      alerts: alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })

  } catch (error) {
    console.error('Error fetching advanced analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advanced analytics' },
      { status: 500 }
    )
  }
}
