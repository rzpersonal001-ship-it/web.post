import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');

  const where: any = {};
  if (startDate) where.scheduledAt = { gte: parseISO(startDate) };
  if (endDate) where.scheduledAt = { ...where.scheduledAt, lte: parseISO(endDate) };
  if (status) where.status = status.toUpperCase();

  try {
    const jobs = await prisma.scheduledJob.findMany({
      where,
      include: {
        post: { include: { category: true } },
        schedule: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching scheduled jobs:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
