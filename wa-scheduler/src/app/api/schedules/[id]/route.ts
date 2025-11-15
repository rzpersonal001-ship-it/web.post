import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateJobsForSchedule } from '@/lib/schedulerLogic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      include: { post: true },
    });
    if (!schedule) {
      return NextResponse.json({ message: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json(schedule);
  } catch (error) {
    console.error(`Error fetching schedule ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: body,
    });

    // Cancel future pending jobs and regenerate
    await prisma.scheduledJob.updateMany({
      where: {
        scheduleId: params.id,
        status: 'PENDING',
        scheduledAt: { gte: new Date() },
      },
      data: { status: 'CANCELLED' },
    });

    await generateJobsForSchedule(updatedSchedule, 30);

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error(`Error updating schedule ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // First, cancel all future pending jobs for this schedule
    await prisma.scheduledJob.updateMany({
      where: {
        scheduleId: params.id,
        status: 'PENDING',
        scheduledAt: { gte: new Date() },
      },
      data: { status: 'CANCELLED' },
    });

    // Then, delete the schedule itself
    await prisma.schedule.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting schedule ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
