import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { s3CreatePresignedPut } from "@/lib/s3"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

interface RouteParams {
  params: {
    animalId: string
  }
}

const mediaUploadSchema = z.object({
  pose: z.enum(["front", "left", "right", "gait"]),
  contentType: z.string().refine(
    (type) => type.startsWith("image/") || type.startsWith("video/"),
    "Content type must be image/* or video/*"
  ),
  fileName: z.string()
})

const mediaCreateSchema = z.object({
  key: z.string(),
  pose: z.enum(["front", "left", "right", "gait"]),
  contentType: z.string(),
  fileName: z.string()
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get media for animal
    const media = await prisma.animalMedia.findMany({
      where: {
        animalId: params.animalId,
      },
      orderBy: {
        takenAt: 'desc'
      }
    })

    return NextResponse.json(media)

  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

// Generate signed URL for upload
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pose, contentType, fileName } = mediaUploadSchema.parse(body)
    
    // Validate animal access
    const animal = await prisma.animal.findFirst({
      where: {
        id: params.animalId,
        farm: {
          tenantId: session.user.tenantId
        }
      }
    })

    if (!animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    }

    // Generate unique key for S3
    const fileExtension = fileName.split('.').pop()
    const key = `animals/${params.animalId}/${pose}/${uuidv4()}.${fileExtension}`

    // Generate signed URL using existing function
    const { url, fields } = await s3CreatePresignedPut(key, contentType)

    return NextResponse.json({
      signedUrl: url,
      key,
      fields
    })

  } catch (error) {
    console.error('Error generating signed URL:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}

// Record uploaded media in database
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key, pose, contentType, fileName } = mediaCreateSchema.parse(body)
    
    // Create media record
    const media = await prisma.animalMedia.create({
      data: {
        animalId: params.animalId,
        kind: contentType.startsWith('video/') ? 'VIDEO' : 'PHOTO',
        pose: pose.toUpperCase() as any,
        url: `${process.env.S3_PUBLIC_URL || 'https://your-bucket.s3.amazonaws.com'}/${key}`,
        mimeType: contentType,
        takenAt: new Date(),
      }
    })

    return NextResponse.json(media)

  } catch (error) {
    console.error('Error recording media:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to record media' },
      { status: 500 }
    )
  }
}
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
