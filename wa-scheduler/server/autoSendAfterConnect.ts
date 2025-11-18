import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function autoSendAfterConnect() {
    const authDir = './baileys_auth_info';
    const qrImagePath = path.join(process.cwd(), 'public', 'whatsapp-qr.png');
    const phoneNumber = '0895339581136';
    
    const message = `🤖 Test Message dari WA Scheduler

Halo! Ini adalah pesan test otomatis.

✅ Aplikasi berhasil running
✅ Database terkoneksi  
✅ WhatsApp Bot aktif
✅ Pesan berhasil dikirim!

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}

🎉 Aplikasi WA Scheduler siap digunakan!

Fitur yang tersedia:
📝 Buat dan kelola konten
📅 Schedule posting otomatis
📊 Dashboard monitoring
💬 Kirim pesan WhatsApp

Dashboard: http://localhost:3000`;

    console.log('\n' + '='.repeat(70));
    console.log('🤖 Auto Send After Connect - WhatsApp Bot');
    console.log('='.repeat(70));
    console.log('\n📱 Memulai koneksi WhatsApp...\n');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('✅ QR Code received!\n');
                
                try {
                    await QRCode.toFile(qrImagePath, qr, {
                        width: 400,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    
                    console.log('✅ QR Code image saved to:', qrImagePath);
                    console.log('\n🌐 Akses via browser:');
                    console.log('   http://localhost:3000/whatsapp-qr.png');
                    console.log('\n⏳ Menunggu scan...\n');
                } catch (err) {
                    console.error('❌ Error generating QR image:', err);
                }
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log('\n❌ Koneksi tertutup');
                
                if (shouldReconnect) {
                    console.log('🔄 Mencoba reconnect...\n');
                    setTimeout(() => autoSendAfterConnect(), 3000);
                } else {
                    console.log('🚪 Logged out.\n');
                    process.exit(0);
                }
            }

            if (connection === "open") {
                console.log('\n' + '='.repeat(70));
                console.log('✅ KONEKSI WHATSAPP BERHASIL!');
                console.log('='.repeat(70));
                console.log('\n📊 Status: Bot aktif dan siap mengirim pesan\n');
                
                // Delete QR image
                if (fs.existsSync(qrImagePath)) {
                    fs.unlinkSync(qrImagePath);
                    console.log('🗑️  QR Code image deleted\n');
                }
                
                // AUTO SEND MESSAGE
                console.log('='.repeat(70));
                console.log('📤 MENGIRIM PESAN OTOMATIS...');
                console.log('='.repeat(70));
                console.log(`\n📞 Nomor tujuan: ${phoneNumber}\n`);
                
                try {
                    // Format phone number
                    let formattedPhone = phoneNumber.replace(/\D/g, '');
                    if (formattedPhone.startsWith('0')) {
                        formattedPhone = '62' + formattedPhone.substring(1);
                    }
                    
                    console.log(`   Format: ${formattedPhone}`);
                    
                    // Check if registered
                    const results = await sock.onWhatsApp(formattedPhone);
                    
                    if (!results || results.length === 0 || !results[0]?.exists) {
                        console.error(`\n❌ Nomor tidak terdaftar di WhatsApp\n`);
                        process.exit(1);
                    }
                    
                    const recipientJid = results[0].jid;
                    console.log(`   JID: ${recipientJid}\n`);
                    
                    // Send message
                    await sock.sendMessage(recipientJid, { text: message });
                    
                    console.log('='.repeat(70));
                    console.log('✅ PESAN BERHASIL DIKIRIM!');
                    console.log('='.repeat(70));
                    console.log('\n📨 Isi Pesan:');
                    console.log('─'.repeat(70));
                    console.log(message);
                    console.log('─'.repeat(70));
                    console.log('\n🎉 Cek WhatsApp Anda di nomor: ' + phoneNumber);
                    console.log('\n✅ MISI SELESAI! Pesan berhasil terkirim.\n');
                    console.log('='.repeat(70) + '\n');
                    
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
                    
                } catch (err: any) {
                    console.error('\n❌ Error mengirim pesan:', err.message);
                    process.exit(1);
                }
            }
        });

        // Keep process alive
        process.on('SIGINT', () => {
            console.log('\n\n👋 Menutup bot...\n');
            if (fs.existsSync(qrImagePath)) {
                fs.unlinkSync(qrImagePath);
            }
            process.exit(0);
        });

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

console.log('\n🚀 Starting Auto Send Bot...\n');
autoSendAfterConnect();
