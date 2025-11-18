import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import axios from 'axios';
import * as fs from 'fs';

async function sendMessageFromFile() {
    const messageFile = process.argv[2];
    
    if (!messageFile) {
        console.error('ERROR: No message file provided');
        process.exit(1);
    }

    try {
        // Read message data
        const messageData = JSON.parse(fs.readFileSync(messageFile, 'utf-8'));
        const { phoneNumber, caption, mediaUrl, mediaType } = messageData;

        const authDir = './baileys_auth_info';
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        const connected = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(false), 15000);

            sock.ev.on("connection.update", (update: any) => {
                const { connection } = update;
                
                if (connection === "open") {
                    clearTimeout(timeout);
                    resolve(true);
                }
                
                if (connection === "close") {
                    clearTimeout(timeout);
                    resolve(false);
                }
            });
        });

        if (!connected) {
            console.error('ERROR: Failed to connect');
            process.exit(1);
        }

        await delay(1000);

        // Format phone number
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            console.error('ERROR: Number not registered');
            process.exit(1);
        }

        const recipientJid = results[0].jid;

        // Send based on media type
        if (mediaType === 'IMAGE') {
            const response = await axios.get(mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(recipientJid, {
                image: buffer,
                caption: caption
            });

        } else if (mediaType === 'VIDEO') {
            const response = await axios.get(mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(recipientJid, {
                video: buffer,
                caption: caption,
                mimetype: 'video/mp4',
                gifPlayback: false,
                ptv: false
            });

        } else {
            await sock.sendMessage(recipientJid, {
                text: caption
            });
        }

        console.log('SUCCESS: Message sent successfully');
        
        await delay(1000);
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
}

sendMessageFromFile();
