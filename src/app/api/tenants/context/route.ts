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

    // Get user's accessible tenants, companies, and farms based on roles
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            companies: {
              include: {
                farms: {
                  include: {
                    _count: {
                      select: { animals: true }
                    }
                  }
                }
              }
            }
          }
        },
        company: {
          include: {
            tenant: true,
            farms: {
              include: {
                _count: {
                  select: { animals: true }
                }
              }
            }
          }
        },
        farm: {
          include: {
            company: {
              include: {
                tenant: true
              }
            },
            _count: {
              select: { animals: true }
            }
          }
        }
      }
    })

    // Build hierarchy of accessible organizations
    const tenantsMap = new Map()

    for (const role of userRoles) {
      let tenantData = null
      let companyData = null
      let farmData = null

      // Extract tenant info based on role scope
      if (role.scope === 'TENANT' && role.tenant) {
        tenantData = role.tenant
      } else if (role.scope === 'COMPANY' && role.company) {
        tenantData = role.company.tenant
        companyData = role.company
      } else if (role.scope === 'FARM' && role.farm) {
        tenantData = role.farm.company.tenant
        companyData = role.farm.company
        farmData = role.farm
      }

      if (tenantData) {
        if (!tenantsMap.has(tenantData.id)) {
          tenantsMap.set(tenantData.id, {
            id: tenantData.id,
            name: tenantData.name,
            plan: tenantData.plan,
            companies: new Map()
          })
        }

        const tenant = tenantsMap.get(tenantData.id)

        // Add company if accessible
        if (companyData || (role.scope === 'TENANT' && tenantData.companies)) {
          const companies = companyData ? [companyData] : tenantData.companies
          
          for (const company of companies) {
            if (!tenant.companies.has(company.id)) {
              tenant.companies.set(company.id, {
                id: company.id,
                name: company.name,
                location: company.location,
                farms: new Map()
              })
            }

            const tenantCompany = tenant.companies.get(company.id)

            // Add farms if accessible
            if (farmData || (role.scope !== 'FARM' && company.farms)) {
              const farms = farmData ? [farmData] : company.farms
              
              for (const farm of farms) {
                tenantCompany.farms.set(farm.id, {
                  id: farm.id,
                  name: farm.name,
                  location: farm.address,
                  animalCount: farm._count?.animals || 0
                })
              }
            }
          }
        }
      }
    }

    // Convert Maps to arrays for JSON response
    const tenants = Array.from(tenantsMap.values()).map(tenant => ({
      ...tenant,
      companies: Array.from(tenant.companies.values()).map(company => ({
        ...company,
        farms: Array.from(company.farms.values())
      }))
    }))

    return NextResponse.json({
      tenants,
      userRoles: userRoles.map(role => ({
        role: role.role,
        scope: role.scope,
        scopeId: role.scopeId
      }))
    })

  } catch (error) {
    console.error("Error fetching tenant context:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId, companyId, farmId } = await request.json()

    // Verify user has access to the requested context
    const hasAccess = await verifyUserAccess(session.user.id, { tenantId, companyId, farmId })
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Store context in user session or database
    // For now, we'll return success as context is managed client-side
    return NextResponse.json({ 
      success: true,
      context: { tenantId, companyId, farmId }
    })

  } catch (error) {
    console.error("Error switching context:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function verifyUserAccess(
  userId: string, 
  context: { tenantId?: string; companyId?: string; farmId?: string }
) {
  const { tenantId, companyId, farmId } = context

  // Build where condition based on context level
  const whereConditions: any = {
    userId,
    isActive: true,
  }

  if (farmId) {
    // Check farm-level access
    whereConditions.OR = [
      { scope: 'FARM', scopeId: farmId },
      { 
        scope: 'COMPANY', 
        scopeId: companyId,
        company: { farms: { some: { id: farmId } } }
      },
      { 
        scope: 'TENANT', 
        scopeId: tenantId,
        tenant: { 
          companies: { 
            some: { 
              id: companyId,
              farms: { some: { id: farmId } }
            }
          }
        }
      }
    ]
  } else if (companyId) {
    // Check company-level access
    whereConditions.OR = [
      { scope: 'COMPANY', scopeId: companyId },
      { 
        scope: 'TENANT', 
        scopeId: tenantId,
        tenant: { companies: { some: { id: companyId } } }
      }
    ]
  } else if (tenantId) {
    // Check tenant-level access
    whereConditions.OR = [
      { scope: 'TENANT', scopeId: tenantId }
    ]
  }

  const userRole = await prisma.userRole.findFirst({
    where: whereConditions,
    include: {
      tenant: true,
      company: true,
      farm: true
    }
  })

  return !!userRole
}
