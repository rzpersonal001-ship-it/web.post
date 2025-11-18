import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET: Fetch all saved messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    const where: any = {
      isActive: true, // Only get active/saved messages
    };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const savedMessages = await prisma.post.findMany({
      where,
      include: {
        category: true,
        scheduledJobs: {
          where: {
            status: 'SENT'
          },
          orderBy: {
            sentAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add usage count
    const messagesWithStats = await Promise.all(
      savedMessages.map(async (msg) => {
        const usageCount = await prisma.scheduledJob.count({
          where: {
            postId: msg.id,
            status: 'SENT'
          }
        });

        return {
          ...msg,
          usageCount,
          lastUsed: msg.scheduledJobs[0]?.sentAt || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: messagesWithStats,
      total: messagesWithStats.length
    });

  } catch (error: any) {
    console.error('Error fetching saved messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved messages' },
      { status: 500 }
    );
  }
}

// POST: Save a new message template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caption, mediaUrl, mediaType, categoryId, title } = body;

    // Validation
    if (!caption || caption.trim() === '') {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      );
    }

    const savedMessage = await prisma.post.create({
      data: {
        caption,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || 'IMAGE',
        categoryId: categoryId || null,
        title: title || caption.substring(0, 50),
        isActive: true
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      message: savedMessage
    });

  } catch (error: any) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

// PUT: Update saved message
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, caption, mediaUrl, mediaType, categoryId, title } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.post.update({
      where: { id },
      data: {
        caption,
        mediaUrl,
        mediaType,
        categoryId,
        title,
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });

  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE: Delete saved message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.post.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
