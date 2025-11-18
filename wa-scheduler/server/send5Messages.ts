import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

interface Message {
    type: 'text' | 'image' | 'video';
    caption: string;
    mediaUrl?: string;
}

const messages: Message[] = [
    {
        type: 'text',
        caption: `📝 Pesan 1 dari 5: TEXT

Halo! Ini adalah pesan pertama dari bulk send test.

✅ Bulk send aktif
✅ 5 pesan akan dikirim

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
    },
    {
        type: 'text',
        caption: `📝 Pesan 2 dari 5: TEXT

Ini pesan kedua, masih text only.

✅ Pesan berurutan
✅ Delay otomatis

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
    },
    {
        type: 'image',
        caption: `🖼️ Pesan 3 dari 5: IMAGE

Ini pesan ketiga dengan gambar.

✅ Gambar berhasil dikirim
✅ Caption berfungsi

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600'
    },
    {
        type: 'text',
        caption: `📝 Pesan 4 dari 5: TEXT

Hampir selesai! Ini pesan keempat.

✅ 4 dari 5 pesan terkirim
✅ Satu lagi!

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
    },
    {
        type: 'image',
        caption: `🖼️ Pesan 5 dari 5: IMAGE (FINAL)

Selesai! Ini pesan terakhir.

✅ 5 pesan berhasil dikirim!
✅ Bulk send complete!

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600?random=2'
    }
];

let sock: any = null;
let isConnected = false;

async function connectBot() {
    const authDir = './baileys_auth_info';
    
    console.log('🔌 Connecting to WhatsApp...\n');

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
    });

    sock.ev.on("creds.update", saveCreds);
    
    // Handle connection updates
    sock.ev.on("connection.update", (update: any) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "open") {
            isConnected = true;
            console.log('✅ Connected!\n');
        }
        
        if (connection === "close") {
            isConnected = false;
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnect:', shouldReconnect);
        }
    });

    return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
            console.log('⏱️  Connection timeout');
            resolve(false);
        }, 30000);

        const checkConnection = setInterval(() => {
            if (isConnected) {
                clearTimeout(timeout);
                clearInterval(checkConnection);
                resolve(true);
            }
        }, 500);
    });
}

async function sendMessage(phoneNumber: string, message: Message, index: number) {
    if (!sock || !isConnected) {
        throw new Error('Bot not connected');
    }

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
            console.log(`   [${index}] Downloading image...`);
            const imageResponse = await axios.get(message.mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            const imageBuffer = Buffer.from(imageResponse.data);
            console.log(`   [${index}] Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
            
            await sock.sendMessage(recipientJid, { 
                image: imageBuffer,
                caption: message.caption
            });
            break;
            
        case 'video':
            if (!message.mediaUrl) throw new Error('Media URL required');
            console.log(`   [${index}] Downloading video...`);
            const videoResponse = await axios.get(message.mediaUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const videoBuffer = Buffer.from(videoResponse.data);
            console.log(`   [${index}] Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            
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
    console.log('📤 BULK SEND - 5 Messages');
    console.log('='.repeat(70));
    console.log(`\n📞 Target: ${phoneNumber}`);
    console.log(`📨 Total: ${messages.length} messages\n`);

    try {
        // Connect
        const connected = await connectBot();
        if (!connected) {
            console.error('❌ Failed to connect\n');
            process.exit(1);
        }

        await delay(3000);

        console.log('='.repeat(70));
        console.log('Starting bulk send...\n');

        const results = [];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const msgNum = i + 1;
            
            try {
                console.log(`[${msgNum}/${messages.length}] Sending ${msg.type.toUpperCase()}...`);
                
                await sendMessage(phoneNumber, msg, msgNum);
                
                console.log(`✅ Message ${msgNum} sent!\n`);
                results.push({ index: msgNum, status: 'success', type: msg.type });
                
                // Longer delay between messages to avoid conflicts
                if (i < messages.length - 1) {
                    console.log(`   ⏳ Waiting 5 seconds before next message...\n`);
                    await delay(5000);
                }
                
            } catch (error: any) {
                console.error(`❌ Message ${msgNum} failed: ${error.message}\n`);
                results.push({ index: msgNum, status: 'error', type: msg.type, error: error.message });
                
                // Still wait before next attempt
                if (i < messages.length - 1) {
                    console.log(`   ⏳ Waiting 5 seconds...\n`);
                    await delay(5000);
                }
            }
        }

        console.log('='.repeat(70));
        console.log('🎉 BULK SEND COMPLETE!');
        console.log('='.repeat(70));
        console.log('\n📊 Detailed Results:');
        results.forEach(r => {
            const icon = r.status === 'success' ? '✅' : '❌';
            const typeIcon = r.type === 'text' ? '📝' : r.type === 'image' ? '🖼️' : '🎬';
            console.log(`   ${icon} Message ${r.index} (${typeIcon} ${r.type.toUpperCase()}): ${r.status.toUpperCase()}`);
        });
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'error').length;
        
        console.log('\n📈 Summary:');
        console.log(`   ✅ Success: ${successCount}/${results.length}`);
        console.log(`   ❌ Failed: ${failCount}/${results.length}`);
        console.log(`   📊 Success Rate: ${Math.round(successCount/results.length*100)}%`);
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

console.log('\n🚀 Starting 5 Messages Bulk Send...\n');
main();
