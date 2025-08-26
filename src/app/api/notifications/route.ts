import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Store active WebSocket connections
const connections = new Map<string, any>()

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get notifications for the user
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.email,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, title, message, priority = 'medium', metadata = {} } = body

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: session.user.email,
        type,
        title,
        message,
        priority,
        metadata,
        read: false
      }
    })

    // Send real-time notification to connected clients
    broadcastNotification(session.user.email, notification)

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { notificationIds, markAsRead = true } = body

    // Update notifications
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.email
      },
      data: {
        read: markAsRead,
        readAt: markAsRead ? new Date() : null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

function broadcastNotification(userId: string, notification: any) {
  // In a real implementation, this would use WebSockets
  // For now, we'll simulate with a simple broadcast mechanism
  console.log(`Broadcasting notification to user ${userId}:`, notification)
  
  // You could integrate with Socket.IO, Server-Sent Events, or WebSocket here
}
