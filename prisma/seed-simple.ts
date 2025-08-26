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

  console.log("✅ Created superadmin user")

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

  console.log("✅ Created demo tenant")

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

  console.log("✅ Created demo company")

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

  console.log("✅ Created demo farms")

  // Skip user roles for now due to foreign key constraint issues

  // Create sample animals
  const sampleAnimals = [
    {
      id: "animal-1",
      farmId: farm1.id,
      species: "CATTLE",
      breed: "Holstein Friesian",
      sex: "FEMALE",
      tagNumber: "HF001",
      birthDateEstimated: new Date("2021-03-15"),
      status: "ACTIVE",
    },
    {
      id: "animal-2", 
      farmId: farm1.id,
      species: "CATTLE",
      breed: "Holstein Friesian",
      sex: "FEMALE",
      tagNumber: "HF002",
      birthDateEstimated: new Date("2021-05-20"),
      status: "ACTIVE",
    },
    {
      id: "animal-3",
      farmId: farm2.id,
      species: "CATTLE",
      breed: "Angus",
      sex: "MALE",
      tagNumber: "AG001",
      birthDateEstimated: new Date("2020-08-15"),
      status: "ACTIVE",
    },
  ]

  for (const animalData of sampleAnimals) {
    await prisma.animal.upsert({
      where: { id: animalData.id },
      update: {},
      create: animalData,
    })
  }

  console.log("✅ Created sample animals")

  // Add sample measurements
  for (const animal of sampleAnimals) {
    await prisma.measurement.create({
      data: {
        animalId: animal.id,
        measuredAt: new Date(),
        weightKg: 400 + Math.random() * 200,
        heightCm: 130 + Math.random() * 20,
        bodyLengthCm: 180 + Math.random() * 30,
        scrotalCircumferenceCm: animal.sex === "MALE" ? 35 + Math.random() * 10 : null,
        measuredBy: "Farm Manager",
      },
    })
  }

  console.log("✅ Created sample measurements")

  console.log("🎉 Database seeding completed successfully!")
  console.log("🔑 Login credentials:")
  console.log("   Email: admin@allcattle.farm")
  console.log("   Password: admin123")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
