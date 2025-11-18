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

async function sendVideo() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    // Using a smaller video for better streaming (under 16MB for WhatsApp)
    const videoUrl = 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4';
    
    const caption = `🎬 Test Video dari WA Scheduler

Halo! Ini adalah pesan dengan video.

✅ Aplikasi berhasil running
✅ Database terkoneksi  
✅ WhatsApp Bot aktif
✅ Pesan dengan video berhasil dikirim!

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}

🎉 Fitur kirim video berfungsi dengan baik!

Dashboard: http://localhost:3000`;

    console.log('\n' + '='.repeat(70));
    console.log('🎬 Mengirim Pesan dengan Video');
    console.log('='.repeat(70));
    console.log(`\n📞 Nomor tujuan: ${phoneNumber}`);
    console.log(`🎥 Video URL: ${videoUrl}\n`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        const connected = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⏱️  Timeout waiting for connection');
                resolve(false);
            }, 15000);
            
            sock.ev.on("connection.update", (update) => {
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
        await delay(2000);

        console.log('📥 Mengunduh video...');
        console.log('   (Video size: ~1MB, mohon tunggu...)\n');
        
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
        console.log(`\n   ✅ Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

        // Format phone number
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        console.log('📤 Mengirim video ke WhatsApp...\n');
        console.log(`   Format: ${formattedPhone}`);

        // Check if registered
        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            console.error(`\n❌ Nomor tidak terdaftar di WhatsApp\n`);
            process.exit(1);
        }

        const recipientJid = results[0].jid;
        console.log(`   JID: ${recipientJid}\n`);
        console.log('   ⏳ Uploading video... (ini mungkin memakan waktu)\n');

        // Send video with caption (streamable)
        await sock.sendMessage(recipientJid, { 
            video: videoBuffer,
            caption: caption,
            mimetype: 'video/mp4',
            gifPlayback: false, // Set to true for GIF-like playback
            ptv: false // Set to true for rounded video message
        });

        console.log('='.repeat(70));
        console.log('✅ VIDEO BERHASIL DIKIRIM!');
        console.log('='.repeat(70));
        console.log('\n📨 Caption:');
        console.log('─'.repeat(70));
        console.log(caption);
        console.log('─'.repeat(70));
        console.log('\n🎥 Video: ' + videoUrl);
        console.log('📱 Dikirim ke: ' + phoneNumber);
        console.log('\n🎉 Cek WhatsApp Anda sekarang!\n');
        console.log('='.repeat(70) + '\n');

        await delay(2000);
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   HTTP Status:', error.response.status);
        }
        console.log('\n');
        process.exit(1);
    }
}

console.log('\n🚀 Starting Send Video...\n');
sendVideo();
