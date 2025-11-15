import { NextResponse } from 'next/server';
import { runScheduler } from '@/lib/schedulerLogic';

export async function GET(request: Request) {
  // Secure the endpoint with a secret key in a production environment
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { processedJobs } = await runScheduler();
    return NextResponse.json({ message: 'Scheduler run completed.', processedJobs });
  } catch (error) {
    console.error('Error running scheduler:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
