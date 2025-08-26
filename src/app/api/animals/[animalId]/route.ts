import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { animalUpdateSchema } from "@/lib/validations"
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

    const animal = await prisma.animal.findUnique({
      where: { id: params.animalId },
      include: {
        farm: {
          select: { 
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
                tenant: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        measurements: {
          orderBy: { measuredAt: "desc" },
          take: 10,
        },
        media: {
          orderBy: { takenAt: "desc" },
        },
        healthEvents: {
          orderBy: { date: "desc" },
          take: 10,
        },
        reproductionUSG: {
          orderBy: { date: "desc" },
          take: 5,
        },
        milkYield: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    })

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    return NextResponse.json(animal)
  } catch (error) {
    console.error("Error fetching animal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = animalUpdateSchema.parse(body)

    // Check if animal exists
    const existingAnimal = await prisma.animal.findUnique({
      where: { id: params.animalId },
    })

    if (!existingAnimal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    // Check if tag number already exists in the farm (if tag is being updated)
    if (data.tagNumber && data.tagNumber !== existingAnimal.tagNumber) {
      const tagExists = await prisma.animal.findFirst({
        where: {
          farmId: existingAnimal.farmId,
          tagNumber: data.tagNumber,
          id: { not: params.animalId },
        },
      })

      if (tagExists) {
        return NextResponse.json(
          { error: "Tag number already exists in this farm" },
          { status: 400 }
        )
      }
    }

    const animal = await prisma.animal.update({
      where: { id: params.animalId },
      data: {
        ...data,
        birthDateEstimated: data.birthDateEstimated ? new Date(data.birthDateEstimated) : undefined,
      },
      include: {
        farm: {
          select: { name: true }
        },
      },
    })

    return NextResponse.json(animal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating animal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if animal exists
    const existingAnimal = await prisma.animal.findUnique({
      where: { id: params.animalId },
    })

    if (!existingAnimal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    // Delete animal (cascade will handle related records)
    await prisma.animal.delete({
      where: { id: params.animalId },
    })

    return NextResponse.json({ message: "Animal deleted successfully" })
  } catch (error) {
    console.error("Error deleting animal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
