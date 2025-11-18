import { Post } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface BaileysDestinationConfig {
    destinationIdentifier: string;
}

// Simple approach: Use external script instead of direct Baileys in Next.js
export async function sendTextWithMediaBaileys(
    post: Post,
    config: BaileysDestinationConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        // Create temp file with message data
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const messageFile = path.join(tempDir, `message_${Date.now()}.json`);
        const messageData = {
            phoneNumber: config.destinationIdentifier,
            caption: post.caption,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType
        };

        fs.writeFileSync(messageFile, JSON.stringify(messageData, null, 2));

        // Execute external script
        const scriptPath = path.join(process.cwd(), 'server', 'sendMessageFromFile.ts');
        const command = `npx ts-node -P tsconfig.server.json "${scriptPath}" "${messageFile}"`;

        console.log('[BaileysService] Executing:', command);

        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            cwd: process.cwd()
        });

        console.log('[BaileysService] Output:', stdout);
        if (stderr) console.error('[BaileysService] Error:', stderr);

        // Clean up temp file
        try {
            fs.unlinkSync(messageFile);
        } catch (e) {
            // Ignore cleanup errors
        }

        // Check if successful
        if (stdout.includes('SUCCESS') || stdout.includes('sent successfully')) {
            return { success: true };
        } else {
            return { success: false, error: stderr || 'Unknown error' };
        }

    } catch (error: any) {
        console.error('[BaileysService] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send message'
        };
    }
}
