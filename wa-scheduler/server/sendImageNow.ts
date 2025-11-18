import makeWASocket, { useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendImageNow() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
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

    console.log('\n' + '='.repeat(70));
    console.log('🎨 Mengirim Pesan dengan Gambar');
    console.log('='.repeat(70));
    console.log(`\n📞 Nomor tujuan: ${phoneNumber}`);
    console.log(`🖼️  Image URL: ${imageUrl}\n`);

    try {
        console.log('📥 Mengunduh gambar...\n');
        
        // Download image first
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(response.data);
        
        console.log(`   ✅ Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`   Type: ${response.headers['content-type']}\n`);
        
        // Load existing auth
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        
        console.log('🔌 Menghubungkan ke WhatsApp...\n');
        
        // Create socket with existing auth
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        // Wait for connection
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
        
        // Wait a bit for connection to stabilize
        await delay(2000);
        
        // Format phone number
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }
        
        console.log('📤 Mengirim pesan dengan gambar...\n');
        console.log(`   Format: ${formattedPhone}`);
        
        // Check if registered
        const results = await sock.onWhatsApp(formattedPhone);
        
        if (!results || results.length === 0 || !results[0]?.exists) {
            console.error(`\n❌ Nomor tidak terdaftar di WhatsApp\n`);
            process.exit(1);
        }
        
        const recipientJid = results[0].jid;
        console.log(`   JID: ${recipientJid}\n`);
        
        // Send image with caption
        await sock.sendMessage(recipientJid, { 
            image: imageBuffer,
            caption: caption
        });
        
        console.log('='.repeat(70));
        console.log('✅ PESAN DENGAN GAMBAR BERHASIL DIKIRIM!');
        console.log('='.repeat(70));
        console.log('\n📨 Caption:');
        console.log('─'.repeat(70));
        console.log(caption);
        console.log('─'.repeat(70));
        console.log('\n🖼️  Gambar: ' + imageUrl);
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

console.log('\n🚀 Starting Send Image...\n');
sendImageNow();
