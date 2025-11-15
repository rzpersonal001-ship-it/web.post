import { NextResponse } from 'next/server';
import { sendTextWithMedia } from '@/lib/whatsappService';
import prisma from '@/lib/db';
import { Post, WhatsAppConfig } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const config = await prisma.whatsAppConfig.findFirst();

    if (!config) {
      return NextResponse.json({ message: 'WhatsApp configuration not found.' }, { status: 404 });
    }

    // Create a dummy post object for the test message
    const testPost: Post = {
      id: 'test-post',
      caption: 'This is a test message from the WA Content Scheduler dashboard.',
      mediaType: 'IMAGE', // Assuming IMAGE for test, can be adapted
      mediaUrl: 'https://via.placeholder.com/300.png/09f/fff', // A placeholder image
      title: 'Test Post',
      categoryId: null,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await sendTextWithMedia(testPost, config);

    if (result.success) {
      return NextResponse.json({ message: 'Test message sent successfully!' });
    } else {
      return NextResponse.json({ message: 'Failed to send test message.', error: result.error }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending test message:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
