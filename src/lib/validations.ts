import { z } from "zod"

// Animal validation schemas
export const animalCreateSchema = z.object({
  species: z.enum(["CATTLE", "SHEEP", "GOAT", "BUFFALO", "HORSE", "CAMEL", "LLAMA"]),
  breed: z.string().min(1, "Breed is required"),
  sex: z.enum(["MALE", "FEMALE"]),
  tagNumber: z.string().min(1, "Tag number is required"),
  birthDateEstimated: z.string().optional(),
  ageMonths: z.number().min(0).max(300).optional(),
  parentMaleId: z.string().optional(),
  parentFemaleId: z.string().optional(),
  notes: z.string().optional(),
})

export const animalUpdateSchema = z.object({
  species: z.enum(["CATTLE", "SHEEP", "GOAT", "BUFFALO", "HORSE", "CAMEL", "LLAMA"]).optional(),
  breed: z.string().min(1, "Breed is required").optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  tagNumber: z.string().min(1, "Tag number is required").optional(),
  birthDateEstimated: z.string().optional(),
  ageMonths: z.number().min(0).max(300).optional(),
  parentMaleId: z.string().optional(),
  parentFemaleId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "SOLD", "DIED", "TRANSFERRED"]).optional(),
})

export const measurementCreateSchema = z.object({
  animalId: z.string().cuid(),
  measuredAt: z.string().datetime(),
  weightKg: z.number().min(0).max(2000).optional(),
  heightCm: z.number().min(0).max(300).optional(),
  bodyLengthCm: z.number().min(0).max(400).optional(),
  scrotalCircumferenceCm: z.number().min(0).max(60).optional(),
  bodyConditionScore: z.number().min(1).max(9).optional(),
  measuredBy: z.string().optional(),
  notes: z.string().optional(),
})

export const usgCreateSchema = z.object({
  animalId: z.string().cuid(),
  date: z.string().datetime(),
  result: z.enum(["PREGNANT", "EMPTY", "INCONCLUSIVE"]),
  fetusAgeWeeks: z.number().min(0).max(50).optional(),
  expectedCalving: z.string().datetime().optional(),
  operator: z.string().min(1, "Operator name is required"),
  notes: z.string().optional(),
})

export const milkYieldCreateSchema = z.object({
  animalId: z.string().cuid(),
  date: z.string().datetime(),
  liters: z.number().min(0).max(100),
  session: z.enum(["MORNING", "EVENING"]),
  quality: z.string().optional(),
  notes: z.string().optional(),
})

export const healthEventCreateSchema = z.object({
  animalId: z.string().cuid(),
  date: z.string().datetime(),
  type: z.enum(["VACCINE", "TREATMENT", "DIAGNOSIS", "SURGERY", "DEATH"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  veterinarian: z.string().optional(),
  cost: z.number().min(0).optional(),
  nextDue: z.string().datetime().optional(),
})

// User and auth schemas
export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const userRoleCreateSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["SUPERADMIN", "TENANT_ADMIN", "COMPANY_ADMIN", "FARM_MANAGER", "ENUMERATOR", "VET", "ANALYST"]),
  scope: z.enum(["GLOBAL", "TENANT", "COMPANY", "FARM"]),
  scopeId: z.string().cuid().optional(),
})

// Tenant management schemas
export const tenantCreateSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  plan: z.string().default("basic"),
  maxCompanies: z.number().min(1).default(1),
  maxFarms: z.number().min(1).default(5),
  maxAnimals: z.number().min(1).default(100),
})

export const companyCreateSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(1, "Company name is required"),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

export const farmCreateSchema = z.object({
  companyId: z.string().cuid(),
  name: z.string().min(1, "Farm name is required"),
  location: z.string().optional(),
  address: z.string().optional(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
})

// Media upload schemas
export const mediaUploadSchema = z.object({
  pose: z.enum(["FRONT", "LEFT", "RIGHT", "GAIT"]),
  contentType: z.string().regex(/^(image|video)\//),
  fileSize: z.number().max(200 * 1024 * 1024), // 200MB max
})

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export const animalFilterSchema = z.object({
  species: z.enum(["CATTLE", "SHEEP", "GOAT", "BUFFALO", "HORSE", "CAMEL", "LLAMA"]).optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  status: z.enum(["ACTIVE", "SOLD", "DIED", "TRANSFERRED"]).optional(),
  breed: z.string().optional(),
  search: z.string().optional(),
})

export type AnimalCreateInput = z.infer<typeof animalCreateSchema>
export type AnimalUpdateInput = z.infer<typeof animalUpdateSchema>
export type MeasurementCreateInput = z.infer<typeof measurementCreateSchema>
export type USGCreateInput = z.infer<typeof usgCreateSchema>
export type MilkYieldCreateInput = z.infer<typeof milkYieldCreateSchema>
export type HealthEventCreateInput = z.infer<typeof healthEventCreateSchema>
export type UserCreateInput = z.infer<typeof userCreateSchema>
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>
export type CompanyCreateInput = z.infer<typeof companyCreateSchema>
export type FarmCreateInput = z.infer<typeof farmCreateSchema>
export type AnimalFilter = z.infer<typeof animalFilterSchema>
export type Pagination = z.infer<typeof paginationSchema>
