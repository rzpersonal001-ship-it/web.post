import prisma from './db';
import { sendTextMessage, sendImageMessage } from '../../server/whatsappServiceBaileys';
import { getCurrentTimeInZone } from './dateUtils';
import { Schedule, WhatsAppConfig } from '@prisma/client';
import { addDays, addMonths, addWeeks, set, lightFormat } from 'date-fns';

const JOB_BUFFER_DAYS = 30;

/**
 * Main scheduler entry
 */
export async function runScheduler(): Promise<{ processedJobs: number }> {
  console.log('Scheduler run started at:', new Date().toISOString());

  const processedCount = await processPendingJobs();
  await ensureFutureJobs();

  console.log(`Scheduler run finished at: ${new Date().toISOString()}. Processed ${processedCount} jobs.`);
  return { processedJobs: processedCount };
}

/**
 * Process due jobs
 */
async function processPendingJobs(): Promise<number> {
  const now = getCurrentTimeInZone();

  const dueJobs = await prisma.scheduledJob.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    include: { post: true },
  });

  console.log(`Found ${dueJobs.length} due jobs to process.`);

  const config = await getWhatsAppConfig();
  if (!config) {
    console.error('WhatsApp configuration not found.');

    for (const job of dueJobs) {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: 'WhatsApp configuration not found.',
        },
      });
    }

    return 0;
  }

  for (const job of dueJobs) {
    try {
      if (job.post.imageUrl) {
        // Asumsi imageUrl adalah URL publik, kita perlu mengambilnya sebagai Buffer
        const response = await fetch(job.post.imageUrl);
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        await sendImageMessage(config.destinationIdentifier, imageBuffer, job.post.content);
      } else {
        await sendTextMessage(config.destinationIdentifier, job.post.content);
      }

      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error: any) {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'An unknown error occurred',
        },
      });
    }
  }

  return dueJobs.length;
}

/**
 * Generate future jobs
 */
async function ensureFutureJobs() {
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
  });

  for (const schedule of schedules) {
    await generateJobsForSchedule(schedule, JOB_BUFFER_DAYS);
  }
}

/**
 * Generate jobs for one schedule
 */
export async function generateJobsForSchedule(schedule: Schedule, daysAhead: number) {
  const now = getCurrentTimeInZone();
  const horizon = addDays(now, daysAhead);

  const lastJob = await prisma.scheduledJob.findFirst({
    where: { scheduleId: schedule.id },
    orderBy: { scheduledAt: 'desc' },
  });

  let startDate = lastJob ? addDays(lastJob.scheduledAt, 1) : schedule.startDate;
  if (startDate < now) startDate = now;

  const newJobsData: { postId: string; scheduleId: string; scheduledAt: Date }[] = [];
  let cursor = startDate;

  while (cursor <= horizon) {

    // STOP jika melewati endDate
    if (schedule.endDate && cursor > schedule.endDate) break;

    const dates = calculateScheduledDates(schedule, cursor, horizon);

    for (const date of dates) {
      if (date <= horizon) {
        newJobsData.push({
          postId: schedule.postId,
          scheduleId: schedule.id,
          scheduledAt: date,
        });
      }
    }

    // Move cursor
    if (schedule.scheduleType === 'DAILY') cursor = addDays(cursor, 1);
    else if (schedule.scheduleType === 'WEEKLY') cursor = addWeeks(cursor, 1);
    else if (schedule.scheduleType === 'MONTHLY') cursor = addMonths(cursor, 1);
    else break; // ONCE
  }

  if (newJobsData.length > 0) {
    await prisma.scheduledJob.createMany({
      data: newJobsData,
      skipDuplicates: true,
    });

    console.log(`Generated ${newJobsData.length} new jobs for schedule ${schedule.id}`);
  }
}

/**
 * Calculate specific execution dates
 */
function calculateScheduledDates(schedule: Schedule, start: Date, end: Date): Date[] {
  const out: Date[] = [];
  let cursor = start;

  const [h, m] = schedule.timeOfDay.split(':').map(Number);
  const applyTime = (d: Date) => set(d, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });

  while (cursor <= end) {
    switch (schedule.scheduleType) {
      case 'DAILY':
        out.push(applyTime(cursor));
        break;

      case 'WEEKLY':
        const daysOfWeek = schedule.daysOfWeek!.split(',').map(d => mapDayOfWeek(d));
        if (daysOfWeek.includes(cursor.getDay())) {
          out.push(applyTime(cursor));
        }
        break;

      case 'MONTHLY':
        const dom = schedule.daysOfMonth!.split(',').map(Number);
        if (dom.includes(cursor.getDate())) {
          out.push(applyTime(cursor));
        }
        break;

      case 'ONCE':
        if (lightFormat(schedule.startDate, 'yyyy-MM-dd') === lightFormat(cursor, 'yyyy-MM-dd')) {
          out.push(applyTime(schedule.startDate));
        }
        break;
    }

    cursor = addDays(cursor, 1);
  }

  return out;
}

function mapDayOfWeek(d: string): number {
  const map: Record<string, number> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
  };
  return map[d.toUpperCase()];
}

async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  return prisma.whatsAppConfig.findFirst();
}
