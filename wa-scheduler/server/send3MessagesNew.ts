import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import axios from 'axios';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

let sock: any = null;
let isConnected = false;

async function connectBot() {
    const authDir = './baileys_auth_info';
    const qrImagePath = path.join(process.cwd(), 'public', 'whatsapp-qr.png');
    
    console.log('🔌 Menghubungkan ke WhatsApp...\n');

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    return new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.log('⏱️  Connection timeout');
            resolve(false);
        }, 60000);

        sock.ev.on("connection.update", async (update: any) => {
            const { connection, qr } = update;

            if (qr) {
                console.log('📱 QR Code generated!');
                try {
                    await QRCode.toFile(qrImagePath, qr, { width: 400 });
                    console.log('   Saved to: public/whatsapp-qr.png');
                    console.log('   URL: http://localhost:3000/whatsapp-qr.png');
                    console.log('   ⏳ Waiting for scan...\n');
                } catch (err) {
                    console.error('Error saving QR:', err);
                }
            }

            if (connection === "open") {
                clearTimeout(timeout);
                isConnected = true;
                console.log('✅ Connected to WhatsApp!\n');
                
                if (fs.existsSync(qrImagePath)) {
                    fs.unlinkSync(qrImagePath);
                }
                
                resolve(true);
            }

            if (connection === "close") {
                clearTimeout(timeout);
                isConnected = false;
                resolve(false);
            }
        });
    });
}

async function sendMessage(phoneNumber: string, type: 'text' | 'image' | 'video', content: any) {
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

    switch (type) {
        case 'text':
            await sock.sendMessage(recipientJid, { text: content });
            break;
        case 'image':
            await sock.sendMessage(recipientJid, { 
                image: content.buffer,
                caption: content.caption
            });
            break;
        case 'video':
            await sock.sendMessage(recipientJid, { 
                video: content.buffer,
                caption: content.caption,
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
    console.log('📱 Mengirim 3 Pesan Test (New Session)');
    console.log('='.repeat(70));
    console.log(`\n📞 Nomor tujuan: ${phoneNumber}\n`);

    try {
        // Connect
        const connected = await connectBot();
        if (!connected) {
            console.error('❌ Failed to connect\n');
            process.exit(1);
        }

        await delay(3000);

        console.log('='.repeat(70));
        console.log('Memulai pengiriman 3 pesan...\n');

        // Message 1: Text
        console.log('📝 [1/3] Mengirim TEXT...');
        const textMessage = `📝 Test Message 1: TEXT ONLY

Halo! Ini adalah pesan text tanpa media.

✅ Aplikasi berhasil running
✅ Database terkoneksi  
✅ WhatsApp Bot aktif

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

Dashboard: http://localhost:3000`;

        await sendMessage(phoneNumber, 'text', textMessage);
        console.log('✅ TEXT sent!\n');
        await delay(3000);

        // Message 2: Image
        console.log('🖼️  [2/3] Mengirim IMAGE...');
        console.log('   Downloading...');
        const imageResponse = await axios.get('https://picsum.photos/800/600', {
            responseType: 'arraybuffer'
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        console.log(`   Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

        const imageCaption = `🖼️ Test Message 2: IMAGE

Halo! Ini adalah pesan dengan gambar.

✅ Gambar berhasil dikirim
✅ Caption berfungsi

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`;

        await sendMessage(phoneNumber, 'image', { buffer: imageBuffer, caption: imageCaption });
        console.log('✅ IMAGE sent!\n');
        await delay(3000);

        // Message 3: Video
        console.log('🎬 [3/3] Mengirim VIDEO...');
        console.log('   Downloading...');
        const videoResponse = await axios.get('https://filesamples.com/samples/video/mp4/sample_640x360.mp4', {
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    process.stdout.write(`\r   Progress: ${percent}%`);
                }
            }
        });
        const videoBuffer = Buffer.from(videoResponse.data);
        console.log(`\n   Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        const videoCaption = `🎬 Test Message 3: VIDEO

Halo! Ini adalah pesan dengan video.

✅ Video berhasil dikirim
✅ Video bisa diputar langsung

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`;

        console.log('   Uploading...');
        await sendMessage(phoneNumber, 'video', { buffer: videoBuffer, caption: videoCaption });
        console.log('✅ VIDEO sent!\n');

        console.log('='.repeat(70));
        console.log('🎉 SEMUA PESAN BERHASIL DIKIRIM!');
        console.log('='.repeat(70));
        console.log('\n📊 Summary:');
        console.log('   ✅ Message 1: TEXT ONLY');
        console.log('   ✅ Message 2: IMAGE with caption');
        console.log('   ✅ Message 3: VIDEO with caption');
        console.log('\n📱 Cek WhatsApp Anda di nomor:', phoneNumber);
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

console.log('\n🚀 Starting 3 Messages Test (New Session)...\n');
main();
