"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const whatsappServiceBaileys_1 = require("./whatsappServiceBaileys");
const prisma = new client_1.PrismaClient();
async function runScheduler() {
    console.log('Scheduler is running...');
    const now = new Date();
    const pendingJob = await prisma.scheduledJob.findFirst({
        where: {
            status: 'PENDING',
            scheduledAt: {
                lte: now,
            },
        },
        orderBy: {
            scheduledAt: 'asc',
        },
        include: {
            post: true,
        }
    });
    if (!pendingJob) {
        console.log('No pending jobs to send.');
        return;
    }
    console.log(`Found job to send: ${pendingJob.id} for post ${pendingJob.postId}`);
    try {
        await prisma.scheduledJob.update({
            where: { id: pendingJob.id },
            data: { status: 'SENDING' },
        });
        if (!pendingJob.post.destination) {
            throw new Error(`Post ${pendingJob.postId} does not have a destination.`);
        }
        if (pendingJob.post.mediaType === 'IMAGE' && pendingJob.post.mediaUrl) {
            const response = await fetch(pendingJob.post.mediaUrl);
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            await (0, whatsappServiceBaileys_1.sendImageMessage)(pendingJob.post.destination, imageBuffer, pendingJob.post.caption);
        }
        else {
            await (0, whatsappServiceBaileys_1.sendTextMessage)(pendingJob.post.destination, pendingJob.post.caption);
        }
        await prisma.scheduledJob.update({
            where: { id: pendingJob.id },
            data: { status: 'SENT', sentAt: new Date() },
        });
        console.log(`Job ${pendingJob.id} sent successfully.`);
    }
    catch (error) {
        console.error(`Failed to send job ${pendingJob.id}:`, error);
        await prisma.scheduledJob.update({
            where: { id: pendingJob.id },
            data: { status: 'FAILED', errorMessage: error.message },
        });
    }
}
runScheduler()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
