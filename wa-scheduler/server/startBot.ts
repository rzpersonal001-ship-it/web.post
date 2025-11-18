import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function startBot() {
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('🤖 WA Scheduler - Baileys Bot');
    console.log('='.repeat(70));
    console.log('\n📱 Memulai koneksi WhatsApp...\n');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false, // We'll handle QR manually
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n' + '='.repeat(70));
                console.log('📱 SCAN QR CODE INI DENGAN WHATSAPP ANDA:');
                console.log('='.repeat(70));
                console.log('\n' + qr + '\n');
                console.log('='.repeat(70));
                console.log('\n💡 Cara scan:');
                console.log('   1. Buka WhatsApp di HP');
                console.log('   2. Tap menu (⋮) > Linked Devices / Perangkat Tertaut');
                console.log('   3. Tap "Link a Device" / "Tautkan Perangkat"');
                console.log('   4. Scan QR code di atas');
                console.log('\n⏳ Menunggu scan...\n');
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                
                console.log('\n❌ Koneksi tertutup');
                console.log(`   Status Code: ${statusCode}`);
                console.log(`   Reconnect: ${shouldReconnect}\n`);
                
                if (shouldReconnect) {
                    console.log('🔄 Mencoba reconnect...\n');
                    setTimeout(() => startBot(), 3000);
                } else {
                    console.log('🚪 Logged out. Jalankan ulang untuk login lagi.\n');
                    process.exit(0);
                }
            }

            if (connection === "open") {
                console.log('\n' + '='.repeat(70));
                console.log('✅ KONEKSI WHATSAPP BERHASIL!');
                console.log('='.repeat(70));
                console.log('\n📊 Status:');
                console.log('   ✅ Bot aktif dan siap menerima perintah');
                console.log('   ✅ Session tersimpan di:', authDir);
                console.log('\n📝 Langkah selanjutnya:');
                console.log('   1. Buka terminal baru');
                console.log('   2. Jalankan: npm run test:send');
                console.log('   3. Atau kirim via API: npm run api');
                console.log('\n💡 Bot akan tetap running. Jangan tutup terminal ini!\n');
                console.log('='.repeat(70) + '\n');
            }
        });

        // Keep process alive
        process.on('SIGINT', () => {
            console.log('\n\n👋 Menutup bot...\n');
            process.exit(0);
        });

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Coba jalankan ulang: npm run bot\n');
        process.exit(1);
    }
}

console.log('\n🚀 Starting WhatsApp Bot...\n');
startBot();
