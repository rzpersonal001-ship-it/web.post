import prisma from './db';
import { Schedule } from '@prisma/client';
import { addDays, addMonths, addWeeks, set, lightFormat } from 'date-fns';

/**
 * Generate jobs for one schedule
 */
export async function generateJobsForSchedule(schedule: Schedule, daysAhead: number) {
  const now = new Date();
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

    if (schedule.scheduleType === 'DAILY') cursor = addDays(cursor, 1);
    else if (schedule.scheduleType === 'WEEKLY') cursor = addWeeks(cursor, 1);
    else if (schedule.scheduleType === 'MONTHLY') cursor = addMonths(cursor, 1);
    else break;
  }

  if (newJobsData.length > 0) {
    await prisma.scheduledJob.createMany({
      data: newJobsData,
      skipDuplicates: true,
    });

    console.log(`Generated ${newJobsData.length} new jobs for schedule ${schedule.id}`);
  }
}

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
