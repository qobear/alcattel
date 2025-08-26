import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { s3CreatePresignedPut } from "@/lib/s3"
import { z } from "zod"

interface RouteParams {
  params: {
    animalId: string
  }
}

const mediaUploadSchema = z.object({
  pose: z.enum(["FRONT", "LEFT", "RIGHT", "GAIT"]),
  contentType: z.string().refine(
    (type) => type.startsWith("image/") || type.startsWith("video/"),
    "Content type must be image/* or video/*"
  ),
  tenantId: z.string(),
  companyId: z.string(),
  farmId: z.string(),
})

const mediaCreateSchema = z.object({
  kind: z.enum(["PHOTO", "VIDEO"]),
  pose: z.enum(["FRONT", "LEFT", "RIGHT", "GAIT"]),
  url: z.string().url(),
  key: z.string(),
  fileSize: z.number().optional(),
  checksum: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if animal exists
    const animal = await prisma.animal.findUnique({
      where: { id: params.animalId },
      select: { id: true }
    })

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    const media = await prisma.animalMedia.findMany({
      where: { animalId: params.animalId },
      orderBy: { takenAt: "desc" },
    })

    return NextResponse.json({ media })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Generate signed URL for upload
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = mediaUploadSchema.parse(body)

    // Check if animal exists
    const animal = await prisma.animal.findUnique({
      where: { id: params.animalId },
      select: { id: true }
    })

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    // Generate S3 key
    const timestamp = Date.now()
    const isVideo = data.contentType.startsWith("video/")
    const extension = isVideo ? "mp4" : "jpg"
    const key = `tenant/${data.tenantId}/company/${data.companyId}/farm/${data.farmId}/animal/${params.animalId}/${timestamp}_${data.pose.toLowerCase()}.${extension}`

    // Generate presigned URL
    const { url, fields } = await s3CreatePresignedPut({ 
      key, 
      contentType: data.contentType,
      maxSize: isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024 // 200MB for video, 10MB for images
    })

    return NextResponse.json({ 
      uploadUrl: url, 
      fields, 
      key,
      metadata: {
        kind: isVideo ? "VIDEO" : "PHOTO",
        pose: data.pose,
        animalId: params.animalId,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error generating upload URL:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Confirm upload and save metadata
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = mediaCreateSchema.parse(body)

    // Check if animal exists
    const animal = await prisma.animal.findUnique({
      where: { id: params.animalId },
      select: { id: true }
    })

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    const media = await prisma.animalMedia.create({
      data: {
        ...data,
        animalId: params.animalId,
        takenAt: new Date(),
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error saving media metadata:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
