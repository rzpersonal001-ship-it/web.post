import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

let sock: any = null;

async function sendTextMessage(phoneNumber: string) {
    const message = `📝 Test Message 1: TEXT ONLY

Halo! Ini adalah pesan text tanpa media.

✅ Aplikasi berhasil running
✅ Database terkoneksi  
✅ WhatsApp Bot aktif

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}

Dashboard: http://localhost:3000`;

    try {
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            throw new Error('Number not registered');
        }

        const recipientJid = results[0].jid;
        await sock.sendMessage(recipientJid, { text: message });
        
        console.log('✅ Message 1 (TEXT) sent successfully!\n');
        return true;
    } catch (error: any) {
        console.error('❌ Failed to send text:', error.message);
        return false;
    }
}

async function sendImageMessage(phoneNumber: string) {
    const imageUrl = 'https://picsum.photos/800/600';
    const caption = `🖼️ Test Message 2: IMAGE

Halo! Ini adalah pesan dengan gambar.

✅ Gambar berhasil dikirim
✅ Caption berfungsi dengan baik

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}`;

    try {
        console.log('📥 Downloading image...');
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(response.data);
        console.log(`   Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            throw new Error('Number not registered');
        }

        const recipientJid = results[0].jid;
        await sock.sendMessage(recipientJid, { 
            image: imageBuffer,
            caption: caption
        });
        
        console.log('✅ Message 2 (IMAGE) sent successfully!\n');
        return true;
    } catch (error: any) {
        console.error('❌ Failed to send image:', error.message);
        return false;
    }
}

async function sendVideoMessage(phoneNumber: string) {
    const videoUrl = 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4';
    const caption = `🎬 Test Message 3: VIDEO

Halo! Ini adalah pesan dengan video.

✅ Video berhasil dikirim
✅ Video bisa diputar langsung
✅ Ukuran optimal untuk streaming

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}`;

    try {
        console.log('📥 Downloading video...');
        const response = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    process.stdout.write(`\r   Progress: ${percentCompleted}%`);
                }
            }
        });
        const videoBuffer = Buffer.from(response.data);
        console.log(`\n   Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            throw new Error('Number not registered');
        }

        const recipientJid = results[0].jid;
        console.log('   Uploading video...\n');
        
        await sock.sendMessage(recipientJid, { 
            video: videoBuffer,
            caption: caption,
            mimetype: 'video/mp4',
            gifPlayback: false,
            ptv: false
        });
        
        console.log('✅ Message 3 (VIDEO) sent successfully!\n');
        return true;
    } catch (error: any) {
        console.error('❌ Failed to send video:', error.message);
        return false;
    }
}

async function send3Messages() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('📱 Mengirim 3 Pesan Test');
    console.log('='.repeat(70));
    console.log(`\n📞 Nomor tujuan: ${phoneNumber}\n`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        const connected = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(false), 30000);
            
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
            console.error('❌ Gagal terkoneksi ke WhatsApp\n');
            process.exit(1);
        }

        console.log('✅ Koneksi berhasil!\n');
        console.log('='.repeat(70));
        console.log('Memulai pengiriman 3 pesan...\n');
        
        await delay(2000);

        // Message 1: Text Only
        console.log('📝 [1/3] Mengirim pesan TEXT...');
        const text1 = await sendTextMessage(phoneNumber);
        if (!text1) throw new Error('Failed to send text message');
        console.log('   ⏳ Waiting 5 seconds...\n');
        await delay(5000);

        // Message 2: Image
        console.log('🖼️  [2/3] Mengirim pesan IMAGE...');
        const image2 = await sendImageMessage(phoneNumber);
        if (!image2) throw new Error('Failed to send image message');
        console.log('   ⏳ Waiting 5 seconds...\n');
        await delay(5000);

        // Message 3: Video
        console.log('🎬 [3/3] Mengirim pesan VIDEO...');
        const video3 = await sendVideoMessage(phoneNumber);
        if (!video3) throw new Error('Failed to send video message');

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
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

console.log('\n🚀 Starting 3 Messages Test...\n');
send3Messages();
