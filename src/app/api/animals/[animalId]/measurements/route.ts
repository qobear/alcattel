import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { measurementCreateSchema } from "@/lib/validations"
import { z } from "zod"

interface RouteParams {
  params: {
    animalId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    // Check if animal exists
    const animal = await prisma.animal.findUnique({
      where: { id: params.animalId },
      select: { id: true, species: true, sex: true }
    })

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    const [measurements, total] = await Promise.all([
      prisma.measurement.findMany({
        where: { animalId: params.animalId },
        orderBy: { measuredAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.measurement.count({
        where: { animalId: params.animalId }
      }),
    ])

    return NextResponse.json({
      measurements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      animal: {
        id: animal.id,
        species: animal.species,
        sex: animal.sex,
      },
    })
  } catch (error) {
    console.error("Error fetching measurements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = measurementCreateSchema.parse(body)

    // Check if animal exists and get its details for validation
    const animal = await prisma.animal.findUnique({
      where: { id: params.animalId },
      select: { id: true, species: true, sex: true }
    })

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    // Validate scrotal circumference is only for males
    if (data.scrotalCircumferenceCm && animal.sex !== "MALE") {
      return NextResponse.json(
        { error: "Scrotal circumference can only be recorded for male animals" },
        { status: 400 }
      )
    }

    const measurement = await prisma.measurement.create({
      data: {
        ...data,
        animalId: params.animalId,
        measuredAt: new Date(data.measuredAt),
      },
    })

    return NextResponse.json(measurement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating measurement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
