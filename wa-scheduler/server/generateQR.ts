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

async function generateQRImage() {
    const authDir = './baileys_auth_info';
    const qrImagePath = path.join(process.cwd(), 'public', 'whatsapp-qr.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('🎨 Generating WhatsApp QR Code Image');
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
                console.log('QR String:', qr);
                console.log('\n🎨 Generating QR Code image...\n');
                
                try {
                    // Generate QR code as PNG
                    await QRCode.toFile(qrImagePath, qr, {
                        width: 400,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    
                    console.log('✅ QR Code image saved to:', qrImagePath);
                    console.log('\n📂 Lokasi file:');
                    console.log('   ', qrImagePath);
                    console.log('\n🌐 Akses via browser:');
                    console.log('   http://localhost:3000/whatsapp-qr.png');
                    console.log('\n💡 Cara scan:');
                    console.log('   1. Buka file di atas dengan image viewer');
                    console.log('   2. Atau akses via browser');
                    console.log('   3. Scan dengan WhatsApp di HP Anda');
                    console.log('\n⏳ Menunggu scan... (Bot tetap running)\n');
                    console.log('='.repeat(70) + '\n');
                } catch (err) {
                    console.error('❌ Error generating QR image:', err);
                }
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log('\n❌ Koneksi tertutup');
                
                if (shouldReconnect) {
                    console.log('🔄 Mencoba reconnect...\n');
                    setTimeout(() => generateQRImage(), 3000);
                } else {
                    console.log('🚪 Logged out.\n');
                    process.exit(0);
                }
            }

            if (connection === "open") {
                console.log('\n' + '='.repeat(70));
                console.log('✅ KONEKSI WHATSAPP BERHASIL!');
                console.log('='.repeat(70));
                console.log('\n📊 Status: Bot aktif dan siap mengirim pesan');
                console.log('\n📝 Kirim pesan test sekarang:');
                console.log('   npm run test:send');
                console.log('\n💡 Bot akan tetap running. Jangan tutup terminal!\n');
                console.log('='.repeat(70) + '\n');
                
                // Delete QR image after successful connection
                if (fs.existsSync(qrImagePath)) {
                    fs.unlinkSync(qrImagePath);
                    console.log('🗑️  QR Code image deleted (no longer needed)\n');
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

console.log('\n🚀 Starting WhatsApp Bot with QR Image Generator...\n');
generateQRImage();
