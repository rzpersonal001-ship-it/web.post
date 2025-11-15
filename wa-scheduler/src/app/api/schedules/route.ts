import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateJobsForSchedule } from '@/lib/schedulerLogic';

export async function GET(request: Request) {
  try {
    const schedules = await prisma.schedule.findMany({
      include: { post: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, scheduleDetails } = body;

    const schedule = await prisma.schedule.create({
      data: {
        ...scheduleDetails,
        postId,
      },
    });

    await generateJobsForSchedule(schedule, 30);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
