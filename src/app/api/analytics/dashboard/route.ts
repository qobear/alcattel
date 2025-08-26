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

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID is required" }, { status: 400 })
    }

    // Verify user has access to this farm
    const hasAccess = await verifyFarmAccess(session.user.id, farmId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch dashboard statistics
    const [
      totalAnimals,
      healthyAnimals,
      sickAnimals,
      pregnantAnimals,
      milkProduction,
      healthEvents,
      upcomingVaccinations
    ] = await Promise.all([
      // Total animals
      prisma.animal.count({
        where: {
          farmId,
          status: "ACTIVE"
        }
      }),

      // Healthy animals (no recent health events marked as sick)
      prisma.animal.count({
        where: {
          farmId,
          status: "ACTIVE",
          NOT: {
            healthEvents: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                },
                status: "SICK"
              }
            }
          }
        }
      }),

      // Sick animals (recent health events marked as sick)
      prisma.animal.count({
        where: {
          farmId,
          status: "ACTIVE",
          healthEvents: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              },
              status: "SICK"
            }
          }
        }
      }),

      // Pregnant animals
      prisma.animal.count({
        where: {
          farmId,
          status: "ACTIVE",
          reproductionRecords: {
            some: {
              type: "PREGNANCY_CHECK",
              result: "PREGNANT",
              createdAt: {
                gte: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000) // Within pregnancy period
              }
            }
          }
        }
      }),

      // Today's milk production
      prisma.milkYield.aggregate({
        where: {
          animal: {
            farmId
          },
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        _sum: {
          yield: true
        }
      }),

      // Recent health events (last 7 days)
      prisma.healthEvent.count({
        where: {
          animal: {
            farmId
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Upcoming vaccinations (next 30 days)
      prisma.animal.count({
        where: {
          farmId,
          status: "ACTIVE",
          // This is a simplified check - in reality you'd have a vaccination schedule table
          healthEvents: {
            some: {
              type: "VACCINATION",
              createdAt: {
                lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last vaccination over a year ago
              }
            }
          }
        }
      })
    ])

    const totalMilkProduction = milkProduction._sum.yield || 0
    const averageMilkPerAnimal = totalAnimals > 0 ? Number((totalMilkProduction / totalAnimals).toFixed(2)) : 0

    const dashboardStats = {
      totalAnimals,
      healthyAnimals,
      sickAnimals,
      pregnantAnimals,
      totalMilkProduction,
      averageMilkPerAnimal,
      recentHealthEvents: healthEvents,
      upcomingVaccinations
    }

    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
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
