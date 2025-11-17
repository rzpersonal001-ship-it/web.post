"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const client_1 = require("@prisma/client");
const whatsappServiceBaileys_1 = require("./whatsappServiceBaileys");
const prisma = new client_1.PrismaClient();
const CHECK_INTERVAL = 10000; // 10 detik
async function getDestination() {
    try {
        const config = await prisma.whatsAppConfig.findFirst();
        if (!config || !config.destinationIdentifier) {
            console.warn("[Scheduler] WhatsApp destination is not configured in WhatsAppConfig.");
            return null;
        }
        return config.destinationIdentifier;
    }
    catch (error) {
        console.error("[Scheduler] DB Error getting destination:", error);
        return null;
    }
}
async function processPendingJobs() {
    try {
        const destination = await getDestination();
        if (!destination) {
            return; // Don't proceed if we don't have a destination
        }
        const now = new Date();
        const pendingJobs = await prisma.scheduledJob.findMany({
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
            },
        });
        if (pendingJobs.length === 0) {
            return;
        }
        console.log(`[Scheduler] Found ${pendingJobs.length} pending jobs. Destination: ${destination}`);
        for (const job of pendingJobs) {
            console.log(`[Scheduler] Processing job ${job.id} for post ${job.postId}`);
            try {
                if (job.post.mediaType === 'IMAGE' && job.post.mediaUrl) {
                    const response = await fetch(job.post.mediaUrl);
                    const imageBuffer = Buffer.from(await response.arrayBuffer());
                    await (0, whatsappServiceBaileys_1.sendImageMessage)(destination, imageBuffer, job.post.caption);
                }
                else {
                    await (0, whatsappServiceBaileys_1.sendTextMessage)(destination, job.post.caption || '');
                }
                await prisma.scheduledJob.update({
                    where: { id: job.id },
                    data: { status: 'SENT', sentAt: new Date() },
                });
                console.log(`[Scheduler] Job ${job.id} sent successfully.`);
            }
            catch (error) {
                console.error(`[Scheduler] Failed to send job ${job.id}:`, error);
                await prisma.scheduledJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', errorMessage: error.message },
                });
            }
        }
    }
    catch (error) {
        console.error("[Scheduler] Failed to process jobs due to DB error:", error);
        // Don't crash the whole service
    }
}
function startScheduler() {
    console.log('[Scheduler] Started. Checking for jobs every 10 seconds...');
    setInterval(processPendingJobs, CHECK_INTERVAL);
}
