import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateRequiredFields } from '@/lib/validation';
import { sendTextWithMedia } from '@/lib/whatsappService';
import { sendTextWithMediaBaileys } from '@/lib/baileysServiceSimple';
import { generateJobsForSchedule } from '@/lib/schedulerLogic';
import { WhatsAppConfig } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const mediaType = searchParams.get('mediaType');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (mediaType) where.mediaType = mediaType.toUpperCase();
  if (search) where.caption = { contains: search, mode: 'insensitive' };

  try {
    const posts = await prisma.post.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await prisma.post.count({ where });
    return NextResponse.json({ posts, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postDetails, scheduleDetails, action } = body;

    const postErrors = validateRequiredFields({
      caption: postDetails.caption,
      mediaType: postDetails.mediaType,
    });
    if (postErrors.length > 0) {
      return NextResponse.json({ message: 'Post validation failed', errors: postErrors }, { status: 400 });
    }
    
    // Validate mediaUrl only if provided
    if (!postDetails.mediaUrl || postDetails.mediaUrl.trim() === '') {
      return NextResponse.json({ 
        message: 'Media URL is required. Please provide a valid image or video URL.', 
        errors: ['mediaUrl is required'] 
      }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        caption: postDetails.caption,
        mediaType: postDetails.mediaType,
        mediaUrl: postDetails.mediaUrl,
        categoryId: postDetails.categoryId || null,
        title: postDetails.title || null,
        isActive: postDetails.saveToLibrary ?? true,
      },
    });

    if (action === 'send-now') {
      const config = await prisma.whatsAppConfig.findFirst();
      if (!config) {
        return NextResponse.json({ message: 'WhatsApp configuration not found.' }, { status: 500 });
      }
      
      // Use Baileys instead of Cloud API
      const { success, error } = await sendTextWithMediaBaileys(post, {
        destinationIdentifier: config.destinationIdentifier
      });
      
      await prisma.scheduledJob.create({
        data: {
          postId: post.id,
          scheduledAt: new Date(),
          status: success ? 'SENT' : 'FAILED',
          errorMessage: error,
          sentAt: success ? new Date() : undefined,
        },
      });
      return NextResponse.json({ message: 'Post sent!', post, success }, { status: 201 });
    }

    if (action === 'schedule') {
      const scheduleErrors = validateRequiredFields({
        scheduleType: scheduleDetails.scheduleType,
        timeOfDay: scheduleDetails.timeOfDay,
        startDate: scheduleDetails.startDate,
      });
      if (scheduleErrors.length > 0) {
        return NextResponse.json({ message: 'Schedule validation failed', errors: scheduleErrors }, { status: 400 });
      }

      const schedule = await prisma.schedule.create({
        data: {
          ...scheduleDetails,
          postId: post.id,
        },
      });
      await generateJobsForSchedule(schedule, 30);
      return NextResponse.json({ message: 'Post scheduled!', post, schedule }, { status: 201 });
    }

    return NextResponse.json({ message: 'Post created and saved to library.', post }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
