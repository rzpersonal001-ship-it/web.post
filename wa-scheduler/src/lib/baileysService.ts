import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    DisconnectReason 
} from "@whiskeysockets/baileys";
import { Post } from '@prisma/client';
import axios from 'axios';
import * as path from 'path';

let sock: any = null;
let isConnected = false;

export interface BaileysDestinationConfig {
    destinationIdentifier: string; // Phone number
}

async function ensureConnection() {
    if (sock && isConnected) {
        return true;
    }

    const authDir = path.join(process.cwd(), 'baileys_auth_info');
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);
        
        sock.ev.on("connection.update", (update: any) => {
            const { connection } = update;
            
            if (connection === "open") {
                isConnected = true;
                console.log('[Baileys] Connected to WhatsApp');
            }
            
            if (connection === "close") {
                isConnected = false;
                console.log('[Baileys] Connection closed');
            }
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 15000);

            const checkInterval = setInterval(() => {
                if (isConnected) {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        return true;
    } catch (error) {
        console.error('[Baileys] Connection error:', error);
        return false;
    }
}

export async function sendTextWithMediaBaileys(
    post: Post,
    config: BaileysDestinationConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        // Ensure connection
        const connected = await ensureConnection();
        if (!connected) {
            return {
                success: false,
                error: 'Failed to connect to WhatsApp'
            };
        }

        // Format phone number
        let phoneNumber = config.destinationIdentifier.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }

        // Check if number is registered
        const results = await sock.onWhatsApp(phoneNumber);
        if (!results || results.length === 0 || !results[0]?.exists) {
            return {
                success: false,
                error: 'Phone number not registered on WhatsApp'
            };
        }

        const recipientJid = results[0].jid;

        // Send based on media type
        if (post.mediaType === 'IMAGE') {
            // Download image
            const response = await axios.get(post.mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            const buffer = Buffer.from(response.data);

            // Send image
            await sock.sendMessage(recipientJid, {
                image: buffer,
                caption: post.caption
            });

        } else if (post.mediaType === 'VIDEO') {
            // Download video
            const response = await axios.get(post.mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const buffer = Buffer.from(response.data);

            // Send video
            await sock.sendMessage(recipientJid, {
                video: buffer,
                caption: post.caption,
                mimetype: 'video/mp4',
                gifPlayback: false,
                ptv: false
            });

        } else {
            // Text only
            await sock.sendMessage(recipientJid, {
                text: post.caption
            });
        }

        console.log(`[Baileys] Message sent to ${phoneNumber}`);
        return { success: true };

    } catch (error: any) {
        console.error('[Baileys] Send error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send message'
        };
    }
}

// Cleanup function
export function closeBaileysConnection() {
    if (sock) {
        sock.end(undefined);
        sock = null;
        isConnected = false;
    }
}
