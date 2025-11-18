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
let isReady = false;

async function sendImageMessage(phoneNumber: string) {
    if (!sock || !isReady) {
        console.log('❌ Bot belum siap!');
        return false;
    }

    const imageUrl = 'https://picsum.photos/800/600';
    const caption = `🎨 Test Image dari WA Scheduler

Halo! Ini adalah pesan dengan gambar.

✅ Aplikasi berhasil running
✅ Database terkoneksi  
✅ WhatsApp Bot aktif
✅ Pesan dengan gambar berhasil dikirim!

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}

🎉 Fitur kirim gambar berfungsi dengan baik!

Dashboard: http://localhost:3000`;

    try {
        console.log('\n📥 Mengunduh gambar...');
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(response.data);
        console.log(`   ✅ Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

        // Format phone number
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        console.log('📤 Mengirim gambar ke:', phoneNumber);
        
        // Check if registered
        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            console.error('❌ Nomor tidak terdaftar di WhatsApp\n');
            return false;
        }

        const recipientJid = results[0].jid;
        
        // Send image
        await sock.sendMessage(recipientJid, { 
            image: imageBuffer,
            caption: caption
        });

        console.log('✅ GAMBAR BERHASIL DIKIRIM!\n');
        return true;

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function startPersistentBot() {
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('🤖 Persistent WhatsApp Bot');
    console.log('='.repeat(70));
    console.log('\n📱 Memulai koneksi...\n');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update: any) => {
            const { connection, lastDisconnect } = update;

            if (connection === "close") {
                isReady = false;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log('\n❌ Koneksi tertutup');
                
                if (shouldReconnect) {
                    console.log('🔄 Reconnecting...\n');
                    await delay(3000);
                    startPersistentBot();
                } else {
                    console.log('🚪 Logged out\n');
                    process.exit(0);
                }
            }

            if (connection === "open") {
                isReady = true;
                console.log('='.repeat(70));
                console.log('✅ BOT SIAP!');
                console.log('='.repeat(70));
                console.log('\n📊 Status: Online dan siap mengirim pesan\n');
                
                // Auto send image after 3 seconds
                console.log('⏳ Mengirim gambar dalam 3 detik...\n');
                await delay(3000);
                
                const success = await sendImageMessage('0895339581136');
                
                if (success) {
                    console.log('='.repeat(70));
                    console.log('🎉 MISI SELESAI!');
                    console.log('='.repeat(70));
                    console.log('\n✅ Pesan dengan gambar berhasil dikirim');
                    console.log('📱 Cek WhatsApp di nomor: 0895339581136\n');
                    
                    // Keep bot running for 5 seconds then exit
                    await delay(5000);
                    process.exit(0);
                }
            }
        });

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

console.log('\n🚀 Starting Persistent Bot...\n');
startPersistentBot();
