import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { animalCreateSchema, paginationSchema, animalFilterSchema } from "@/lib/validations"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pagination = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    })
    
    const filters = animalFilterSchema.parse({
      species: searchParams.get("species"),
      sex: searchParams.get("sex"),
      status: searchParams.get("status"),
      breed: searchParams.get("breed"),
      search: searchParams.get("search"),
    })

    const farmId = searchParams.get("farmId")
    if (!farmId) {
      return NextResponse.json({ error: "Farm ID is required" }, { status: 400 })
    }

    // Build where clause
    const where: any = {
      farmId,
    }

    if (filters.species) where.species = filters.species
    if (filters.sex) where.sex = filters.sex
    if (filters.status) where.status = filters.status
    if (filters.breed) where.breed = { contains: filters.breed, mode: "insensitive" }
    if (filters.search) {
      where.OR = [
        { tagNumber: { contains: filters.search, mode: "insensitive" } },
        { breed: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        include: {
          farm: {
            select: { name: true }
          },
          measurements: {
            orderBy: { measuredAt: "desc" },
            take: 1,
          },
          media: {
            where: { kind: "PHOTO", pose: "FRONT" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.animal.count({ where }),
    ])

    return NextResponse.json({
      animals,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    })
  } catch (error) {
    console.error("Error fetching animals:", error)
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

    const body = await request.json()
    const data = animalCreateSchema.parse(body)

    // Check if tag number already exists in the farm
    const existingAnimal = await prisma.animal.findFirst({
      where: {
        farmId: body.farmId,
        tagNumber: data.tagNumber,
      },
    })

    if (existingAnimal) {
      return NextResponse.json(
        { error: "Tag number already exists in this farm" },
        { status: 400 }
      )
    }

    const animal = await prisma.animal.create({
      data: {
        ...data,
        farmId: body.farmId,
        birthDateEstimated: data.birthDateEstimated ? new Date(data.birthDateEstimated) : null,
      },
      include: {
        farm: {
          select: { name: true }
        },
      },
    })

    return NextResponse.json(animal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating animal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
