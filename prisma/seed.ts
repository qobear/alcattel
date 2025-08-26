import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create superadmin user
  const hashedPassword = await bcrypt.hash("admin123", 12)
  
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@allcattle.farm" },
    update: {},
    create: {
      email: "admin@allcattle.farm",
      name: "Super Administrator",
      password: hashedPassword,
    },
  })

  // Create superadmin role
  await prisma.userRole.upsert({
    where: {
      userId_role_scope_scopeId: {
        userId: superAdmin.id,
        role: "SUPERADMIN",
        scope: "GLOBAL",
        scopeId: "global",
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      role: "SUPERADMIN",
      scope: "GLOBAL",
      scopeId: "global",
    },
  })

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: {
      id: "demo-tenant",
      name: "Demo Livestock Farms",
      plan: "premium",
      maxCompanies: 5,
      maxFarms: 25,
      maxAnimals: 1000,
    },
  })

  // Create demo company
  const demoCompany = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: {},
    create: {
      id: "demo-company",
      tenantId: demoTenant.id,
      name: "Green Valley Livestock",
      location: "Rural Valley, CA",
      phone: "+1-555-0123",
      email: "contact@greenvalley.farm",
    },
  })

  // Create demo farms
  const farm1 = await prisma.farm.upsert({
    where: { id: "farm-1" },
    update: {},
    create: {
      id: "farm-1",
      companyId: demoCompany.id,
      name: "North Pasture Farm",
      location: "North Valley",
      address: "123 Farm Road, Rural Valley, CA",
      gpsLat: 37.7749,
      gpsLng: -122.4194,
    },
  })

  const farm2 = await prisma.farm.upsert({
    where: { id: "farm-2" },
    update: {},
    create: {
      id: "farm-2",
      companyId: demoCompany.id,
      name: "South Meadow Farm",
      location: "South Valley",
      address: "456 Meadow Lane, Rural Valley, CA",
      gpsLat: 37.7849,
      gpsLng: -122.4094,
    },
  })

  // Create demo user with farm manager role
  const farmManager = await prisma.user.upsert({
    where: { email: "manager@greenvalley.farm" },
    update: {},
    create: {
      email: "manager@greenvalley.farm",
      name: "John Manager",
      password: hashedPassword,
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_role_scope_scopeId: {
        userId: farmManager.id,
        role: "FARM_MANAGER",
        scope: "FARM",
        scopeId: farm1.id,
      },
    },
    update: {},
    create: {
      userId: farmManager.id,
      role: "FARM_MANAGER",
      scope: "FARM",
      scopeId: farm1.id,
    },
  })

  // Create demo animals
  const animals = [
    {
      farmId: farm1.id,
      species: "CATTLE",
      breed: "Holstein",
      sex: "FEMALE",
      tagNumber: "HF001",
      ageMonths: 36,
      status: "ACTIVE",
    },
    {
      farmId: farm1.id,
      species: "CATTLE",
      breed: "Holstein",
      sex: "FEMALE",
      tagNumber: "HF002",
      ageMonths: 42,
      status: "ACTIVE",
    },
    {
      farmId: farm1.id,
      species: "CATTLE",
      breed: "Angus",
      sex: "MALE",
      tagNumber: "MA001",
      ageMonths: 24,
      status: "ACTIVE",
    },
    {
      farmId: farm2.id,
      species: "SHEEP",
      breed: "Merino",
      sex: "FEMALE",
      tagNumber: "SF001",
      ageMonths: 18,
      status: "ACTIVE",
    },
    {
      farmId: farm2.id,
      species: "GOAT",
      breed: "Nubian",
      sex: "FEMALE",
      tagNumber: "GF001",
      ageMonths: 24,
      status: "ACTIVE",
    },
  ]

  for (const animalData of animals) {
    await prisma.animal.upsert({
      where: {
        farmId_tagNumber: {
          farmId: animalData.farmId,
          tagNumber: animalData.tagNumber,
        },
      },
      update: {},
      create: animalData as any,
    })
  }

  // Create some demo measurements
  const demoAnimals = await prisma.animal.findMany({
    take: 3,
  })

  for (const animal of demoAnimals) {
    await prisma.measurement.create({
      data: {
        animalId: animal.id,
        measuredAt: new Date(),
        weightKg: animal.species === "CATTLE" ? 450 + Math.random() * 100 : 60 + Math.random() * 20,
        heightCm: animal.species === "CATTLE" ? 140 + Math.random() * 20 : 70 + Math.random() * 10,
        bodyLengthCm: animal.species === "CATTLE" ? 180 + Math.random() * 30 : 80 + Math.random() * 15,
        bodyConditionScore: 3 + Math.random() * 2,
        measuredBy: "Farm Manager",
      },
    })
  }

  console.log("✅ Database seeded successfully!")
  console.log("🔑 Login credentials:")
  console.log("   Superadmin: admin@allcattle.farm / admin123")
  console.log("   Farm Manager: manager@greenvalley.farm / admin123")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
