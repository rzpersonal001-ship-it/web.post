import prisma from '../src/lib/db';
import { generateJobsForSchedule } from '../src/lib/schedulerLogic';
import { subDays } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  console.log('--- Running Scheduler ONCE Job Test ---');

  // 1. Create a Post
  const post = await prisma.post.create({
    data: {
      caption: 'Test post for ONCE schedule in the past',
      mediaType: 'IMAGE',
      mediaUrl: 'https://example.com/test.jpg',
    },
  });
  console.log(`Created post with ID: ${post.id}`);

  // 2. Create a "ONCE" Schedule with a startDate in the past
  const schedule = await prisma.schedule.create({
    data: {
      postId: post.id,
      scheduleType: 'ONCE',
      startDate: subDays(new Date(), 1),
      timeOfDay: '10:00',
      isActive: true,
    },
  });
  console.log(`Created schedule with ID: ${schedule.id}`);

  try {
    // 3. Run the job generation logic
    await generateJobsForSchedule(schedule, 30);

    // 4. Check if a job was created
    const jobs = await prisma.scheduledJob.findMany({
      where: { scheduleId: schedule.id },
    });

    // 5. Assert and report
    if (jobs.length > 0) {
      console.log(`✅ PASSED: Found ${jobs.length} job(s) for the ONCE schedule.`);
    } else {
      console.error('❌ FAILED: No job was created for the ONCE schedule with a past startDate.');
      // Exit with a non-zero code to indicate failure
      process.exit(1);
    }
  } catch (error) {
    console.error('An error occurred during the test:', error);
    process.exit(1);
  } finally {
    // 6. Clean up the created data
    await prisma.scheduledJob.deleteMany({ where: { scheduleId: schedule.id } });
    await prisma.schedule.delete({ where: { id: schedule.id } });
    await prisma.post.delete({ where: { id: post.id } });
    console.log('Cleaned up test data.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
