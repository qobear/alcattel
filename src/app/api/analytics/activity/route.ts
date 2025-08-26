import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get("farmId")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID is required" }, { status: 400 })
    }

    // Verify user has access to this farm
    const hasAccess = await verifyFarmAccess(session.user.id, farmId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch recent activities from different sources
    const [healthEvents, milkRecords, reproductionRecords, measurements] = await Promise.all([
      // Recent health events
      prisma.healthEvent.findMany({
        where: {
          animal: { farmId }
        },
        include: {
          animal: {
            select: {
              id: true,
              tagNumber: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // Recent milk records
      prisma.milkYield.findMany({
        where: {
          animal: { farmId }
        },
        include: {
          animal: {
            select: {
              id: true,
              tagNumber: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // Recent reproduction records
      prisma.reproductionRecord.findMany({
        where: {
          animal: { farmId }
        },
        include: {
          animal: {
            select: {
              id: true,
              tagNumber: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // Recent measurements
      prisma.measurement.findMany({
        where: {
          animal: { farmId }
        },
        include: {
          animal: {
            select: {
              id: true,
              tagNumber: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ])

    // Combine and format all activities
    const activities = [
      ...healthEvents.map(event => ({
        id: `health-${event.id}`,
        type: 'health' as const,
        message: `Health event: ${event.type.toLowerCase().replace('_', ' ')} - ${event.status}`,
        timestamp: event.createdAt.toISOString(),
        animalId: event.animal.id,
        animalTag: event.animal.tagNumber
      })),
      ...milkRecords.map(record => ({
        id: `milk-${record.id}`,
        type: 'milk' as const,
        message: `Milk recorded: ${record.yield}L`,
        timestamp: record.createdAt.toISOString(),
        animalId: record.animal.id,
        animalTag: record.animal.tagNumber
      })),
      ...reproductionRecords.map(record => ({
        id: `reproduction-${record.id}`,
        type: 'reproduction' as const,
        message: `Reproduction: ${record.type.toLowerCase().replace('_', ' ')} - ${record.result || 'Recorded'}`,
        timestamp: record.createdAt.toISOString(),
        animalId: record.animal.id,
        animalTag: record.animal.tagNumber
      })),
      ...measurements.map(measurement => ({
        id: `measurement-${measurement.id}`,
        type: 'measurement' as const,
        message: `Measurement: ${measurement.type.toLowerCase()} - ${measurement.value}${measurement.unit}`,
        timestamp: measurement.createdAt.toISOString(),
        animalId: measurement.animal.id,
        animalTag: measurement.animal.tagNumber
      }))
    ]

    // Sort by timestamp (most recent first) and limit results
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      activities: sortedActivities,
      total: activities.length
    })

  } catch (error) {
    console.error("Error fetching activity feed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function verifyFarmAccess(userId: string, farmId: string) {
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [
        { scope: "FARM", scopeId: farmId },
        { 
          scope: "COMPANY", 
          company: { 
            farms: { 
              some: { id: farmId } 
            } 
          } 
        },
        { 
          scope: "TENANT", 
          tenant: { 
            companies: { 
              some: { 
                farms: { 
                  some: { id: farmId } 
                } 
              } 
            } 
          } 
        }
      ]
    }
  })

  return !!userRole
}
