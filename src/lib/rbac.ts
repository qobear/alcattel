import { User, RoleType, ScopeType } from "@prisma/client"
import { prisma } from "./prisma"

export interface UserWithRoles extends User {
  roles: {
    role: RoleType
    scope: ScopeType
    scopeId: string | null
  }[]
}

export async function ensureScope(
  user: UserWithRoles,
  scope: ScopeType,
  scopeId: string,
  allowedRoles: RoleType[]
): Promise<boolean> {
  // Superadmin has access to everything
  if (user.roles.some(r => r.role === "SUPERADMIN")) {
    return true
  }

  // Check if user has required role in the specific scope
  const hasRole = user.roles.some(role => {
    return (
      allowedRoles.includes(role.role) &&
      role.scope === scope &&
      role.scopeId === scopeId
    )
  })

  return hasRole
}

export async function ensureTenantAccess(
  user: UserWithRoles,
  tenantId: string,
  allowedRoles: RoleType[] = ["TENANT_ADMIN", "COMPANY_ADMIN", "FARM_MANAGER", "ENUMERATOR", "VET", "ANALYST"]
): Promise<boolean> {
  return ensureScope(user, "TENANT", tenantId, allowedRoles)
}

export async function ensureCompanyAccess(
  user: UserWithRoles,
  companyId: string,
  allowedRoles: RoleType[] = ["COMPANY_ADMIN", "FARM_MANAGER", "ENUMERATOR", "VET", "ANALYST"]
): Promise<boolean> {
  return ensureScope(user, "COMPANY", companyId, allowedRoles)
}

export async function ensureFarmAccess(
  user: UserWithRoles,
  farmId: string,
  allowedRoles: RoleType[] = ["FARM_MANAGER", "ENUMERATOR", "VET", "ANALYST"]
): Promise<boolean> {
  return ensureScope(user, "FARM", farmId, allowedRoles)
}

export async function getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        where: { isActive: true },
        select: {
          role: true,
          scope: true,
          scopeId: true,
        },
      },
    },
  })

  return user as UserWithRoles | null
}

export async function getUserPermissions(userId: string) {
  const user = await getUserWithRoles(userId)
  if (!user) return null

  const permissions = {
    isSuperAdmin: user.roles.some(r => r.role === "SUPERADMIN"),
    tenants: user.roles.filter(r => r.scope === "TENANT").map(r => ({
      id: r.scopeId!,
      role: r.role,
    })),
    companies: user.roles.filter(r => r.scope === "COMPANY").map(r => ({
      id: r.scopeId!,
      role: r.role,
    })),
    farms: user.roles.filter(r => r.scope === "FARM").map(r => ({
      id: r.scopeId!,
      role: r.role,
    })),
  }

  return permissions
}

export async function createUserRole(
  userId: string,
  role: RoleType,
  scope: ScopeType,
  scopeId?: string
) {
  return prisma.userRole.create({
    data: {
      userId,
      role,
      scope,
      scopeId,
    },
  })
}

export async function removeUserRole(
  userId: string,
  role: RoleType,
  scope: ScopeType,
  scopeId?: string
) {
  return prisma.userRole.updateMany({
    where: {
      userId,
      role,
      scope,
      scopeId,
    },
    data: {
      isActive: false,
    },
  })
}
