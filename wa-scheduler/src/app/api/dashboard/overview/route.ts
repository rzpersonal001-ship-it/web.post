import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const now = new Date();

    // 1. Get stats
    const totalContent = await prisma.post.count({ where: { isActive: true } });
    const activeSchedules = await prisma.schedule.count({ where: { isActive: true } });

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const postsToday = await prisma.scheduledJob.count({
      where: {
        scheduledAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: { not: 'CANCELLED' },
      },
    });

    // 2. Get upcoming posts
    const upcomingJobs = await prisma.scheduledJob.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          gte: now,
          lte: addDays(now, 7), // Next 7 days
        },
      },
      include: {
        post: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 10, // Limit to the next 10 upcoming jobs
    });

    return NextResponse.json({
      stats: {
        totalContent,
        activeSchedules,
        postsToday,
      },
      upcomingJobs,
    });

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
