import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendWithImage() {
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
        // Load existing auth
        const { state } = await useMultiFileAuthState(authDir);
        
        // Create socket with existing auth
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);
            
            sock.ev.on("connection.update", async (update) => {
                const { connection } = update;
                
                if (connection === "open") {
                    clearTimeout(timeout);
                    console.log('✅ Koneksi berhasil!\n');
                    console.log('📥 Mengunduh gambar...\n');
                    
                    try {
                        // Download image
                        const response = await axios.get(imageUrl, {
                            responseType: 'arraybuffer'
                        });
                        const imageBuffer = Buffer.from(response.data);
                        
                        console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
                        console.log(`   Type: ${response.headers['content-type']}\n`);
                        
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
                            reject(new Error('Number not registered'));
                            return;
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
                        
                        setTimeout(() => {
                            sock.end(undefined);
                            resolve();
                        }, 2000);
                        
                    } catch (err: any) {
                        clearTimeout(timeout);
                        console.error('\n❌ Error:', err.message);
                        reject(err);
                    }
                }
                
                if (connection === "close") {
                    clearTimeout(timeout);
                    reject(new Error('Connection closed'));
                }
            });
        });
        
        process.exit(0);
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Pastikan bot sudah terkoneksi (session tersimpan)!\n');
        process.exit(1);
    }
}

console.log('\n🚀 Starting Send with Image...\n');
sendWithImage();
