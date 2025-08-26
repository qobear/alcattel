import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Database utility functions for multi-tenant operations
export async function getTenantContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          tenant: true,
          company: true,
          farm: true
        }
      }
    }
  })
  
  return user?.userRoles || []
}

export async function validateAccess(
  userId: string, 
  scope: 'tenant' | 'company' | 'farm',
  scopeId: string,
  requiredRoles: string[]
) {
  const userRoles = await getTenantContext(userId)
  
  const hasAccess = userRoles.some(role => 
    role.scope === scope && 
    role.scopeId === scopeId && 
    requiredRoles.includes(role.role)
  )
  
  if (!hasAccess) {
    throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`)
  }
  
  return true
}

// Animal operations with real database
export async function getAnimals(farmId: string, filters?: {
  species?: string
  breed?: string
  sex?: string
  status?: string
  search?: string
}) {
  const whereClause: any = { farmId }
  
  if (filters?.species) whereClause.species = filters.species
  if (filters?.breed) whereClause.breed = { contains: filters.breed, mode: 'insensitive' }
  if (filters?.sex) whereClause.sex = filters.sex
  if (filters?.status) whereClause.status = filters.status
  if (filters?.search) {
    whereClause.OR = [
      { tagNumber: { contains: filters.search, mode: 'insensitive' } },
      { breed: { contains: filters.search, mode: 'insensitive' } }
    ]
  }
  
  return await db.animal.findMany({
    where: whereClause,
    include: {
      measurements: {
        orderBy: { measuredAt: 'desc' },
        take: 1
      },
      healthEvents: {
        where: { status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        take: 3
      },
      reproUSG: {
        where: { result: 'PREGNANT' },
        orderBy: { date: 'desc' },
        take: 1
      },
      milkYield: {
        orderBy: { date: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createAnimal(farmId: string, data: {
  species: string
  breed: string
  sex: 'MALE' | 'FEMALE'
  tagNumber: string
  birthdateEstimated?: Date
  status?: string
}) {
  // Check if tag number is unique within farm
  const existing = await db.animal.findFirst({
    where: {
      farmId,
      tagNumber: data.tagNumber
    }
  })
  
  if (existing) {
    throw new Error(`Tag number ${data.tagNumber} already exists in this farm`)
  }
  
  return await db.animal.create({
    data: {
      ...data,
      farmId,
      status: data.status || 'ACTIVE'
    }
  })
}

// Analytics with real data
export async function getFarmAnalytics(farmId: string, period: string = '30d') {
  const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 365
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)
  
  // Population overview
  const totalAnimals = await db.animal.count({ where: { farmId } })
  const animalsBySpecies = await db.animal.groupBy({
    by: ['species'],
    where: { farmId },
    _count: true
  })
  
  const animalsBySex = await db.animal.groupBy({
    by: ['sex'],
    where: { farmId },
    _count: true
  })
  
  // Health metrics
  const overdueHealthEvents = await db.healthEvent.count({
    where: {
      animal: { farmId },
      status: 'SCHEDULED',
      date: { lt: new Date() }
    }
  })
  
  // Reproduction metrics
  const pregnantAnimals = await db.reproUSG.count({
    where: {
      animal: { farmId },
      result: 'PREGNANT',
      date: { gte: startDate }
    }
  })
  
  // Recent activity
  const recentHealthEvents = await db.healthEvent.findMany({
    where: {
      animal: { farmId },
      createdAt: { gte: startDate }
    },
    include: {
      animal: { select: { tagNumber: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  const recentMeasurements = await db.measurement.findMany({
    where: {
      animal: { farmId },
      measuredAt: { gte: startDate }
    },
    include: {
      animal: { select: { tagNumber: true } }
    },
    orderBy: { measuredAt: 'desc' },
    take: 10
  })
  
  return {
    population: {
      total: totalAnimals,
      bySpecies: animalsBySpecies,
      bySex: animalsBySex
    },
    health: {
      overdueEvents: overdueHealthEvents,
      recentEvents: recentHealthEvents
    },
    reproduction: {
      pregnantCount: pregnantAnimals
    },
    activity: {
      healthEvents: recentHealthEvents,
      measurements: recentMeasurements
    }
  }
}
