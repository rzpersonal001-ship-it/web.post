import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

interface BulkMessage {
    type: 'text' | 'image' | 'video';
    caption: string;
    mediaUrl?: string;
}

const testMessages: BulkMessage[] = [
    {
        type: 'text',
        caption: `📝 Bulk Test 1: TEXT ONLY

Ini adalah pesan pertama dari bulk send test.

✅ Fitur bulk send aktif
✅ Pesan dikirim otomatis

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
    },
    {
        type: 'image',
        caption: `🖼️ Bulk Test 2: IMAGE

Ini adalah pesan kedua dengan gambar.

✅ Gambar berhasil dikirim
✅ Bulk send berfungsi

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600'
    },
    {
        type: 'video',
        caption: `🎬 Bulk Test 3: VIDEO

Ini adalah pesan ketiga dengan video.

✅ Video streamable
✅ Bulk send complete

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4'
    }
];

let sock: any = null;

async function connectBot() {
    const authDir = './baileys_auth_info';
    
    console.log('🔌 Connecting to WhatsApp...\n');

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
            console.log('⏱️  Connection timeout');
            resolve(false);
        }, 30000);

        sock.ev.on("connection.update", (update: any) => {
            const { connection } = update;

            if (connection === "open") {
                clearTimeout(timeout);
                console.log('✅ Connected!\n');
                resolve(true);
            }

            if (connection === "close") {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    });
}

async function sendMessage(phoneNumber: string, message: BulkMessage) {
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1);
    }

    const results = await sock.onWhatsApp(formattedPhone);
    if (!results || results.length === 0 || !results[0]?.exists) {
        throw new Error('Number not registered');
    }

    const recipientJid = results[0].jid;

    switch (message.type) {
        case 'text':
            await sock.sendMessage(recipientJid, { text: message.caption });
            break;
            
        case 'image':
            if (!message.mediaUrl) throw new Error('Media URL required');
            console.log('   Downloading image...');
            const imageResponse = await axios.get(message.mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            const imageBuffer = Buffer.from(imageResponse.data);
            console.log(`   Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
            
            await sock.sendMessage(recipientJid, { 
                image: imageBuffer,
                caption: message.caption
            });
            break;
            
        case 'video':
            if (!message.mediaUrl) throw new Error('Media URL required');
            console.log('   Downloading video...');
            const videoResponse = await axios.get(message.mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        process.stdout.write(`\r   Progress: ${percent}%`);
                    }
                }
            });
            const videoBuffer = Buffer.from(videoResponse.data);
            console.log(`\n   Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            console.log('   Uploading...');
            
            await sock.sendMessage(recipientJid, { 
                video: videoBuffer,
                caption: message.caption,
                mimetype: 'video/mp4',
                gifPlayback: false,
                ptv: false
            });
            break;
    }
}

async function main() {
    const phoneNumber = '0895339581136';
    
    console.log('\n' + '='.repeat(70));
    console.log('📤 BULK SEND TEST - 3 Messages');
    console.log('='.repeat(70));
    console.log(`\n📞 Target: ${phoneNumber}\n`);

    try {
        // Connect
        const connected = await connectBot();
        if (!connected) {
            console.error('❌ Failed to connect\n');
            process.exit(1);
        }

        await delay(2000);

        console.log('='.repeat(70));
        console.log('Starting bulk send...\n');

        const results = [];

        for (let i = 0; i < testMessages.length; i++) {
            const msg = testMessages[i];
            
            try {
                console.log(`[${i + 1}/${testMessages.length}] Sending ${msg.type.toUpperCase()}...`);
                
                await sendMessage(phoneNumber, msg);
                
                console.log(`✅ Message ${i + 1} sent!\n`);
                results.push({ index: i + 1, status: 'success' });
                
                // Delay between messages
                if (i < testMessages.length - 1) {
                    console.log('   ⏳ Waiting 3 seconds...\n');
                    await delay(3000);
                }
                
            } catch (error: any) {
                console.error(`❌ Message ${i + 1} failed: ${error.message}\n`);
                results.push({ index: i + 1, status: 'error', error: error.message });
            }
        }

        console.log('='.repeat(70));
        console.log('🎉 BULK SEND COMPLETE!');
        console.log('='.repeat(70));
        console.log('\n📊 Summary:');
        results.forEach(r => {
            const icon = r.status === 'success' ? '✅' : '❌';
            console.log(`   ${icon} Message ${r.index}: ${r.status.toUpperCase()}`);
        });
        
        const successCount = results.filter(r => r.status === 'success').length;
        console.log(`\n📈 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
        console.log('\n📱 Check WhatsApp:', phoneNumber);
        console.log('\n' + '='.repeat(70) + '\n');

        await delay(2000);
        if (sock) sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (sock) sock.end(undefined);
        process.exit(1);
    }
}

console.log('\n🚀 Starting Bulk Send Test...\n');
main();
