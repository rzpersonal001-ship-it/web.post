import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendTextOnly() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('📱 TEST TEXT ONLY - No Image');
    console.log('='.repeat(70));
    console.log(`\n📞 Target: ${phoneNumber}\n`);

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
                console.log('⏱️  Connection timeout');
                resolve(false);
            }, 30000);

            sock.ev.on("connection.update", (update: any) => {
                const { connection } = update;
                
                if (connection === "open") {
                    clearTimeout(timeout);
                    console.log('✅ Connected!\n');
                    resolve(true);
                }
                
                if (connection === "close") {
                    clearTimeout(timeout);
                    resolve(false);
                }
            });
        });

        if (!connected) {
            console.error('❌ Failed to connect\n');
            process.exit(1);
        }

        await delay(2000);

        // Format phone number
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        console.log('📤 Checking number registration...');
        const results = await sock.onWhatsApp(formattedPhone);
        if (!results || results.length === 0 || !results[0]?.exists) {
            console.error(`\n❌ Number not registered on WhatsApp\n`);
            process.exit(1);
        }

        const recipientJid = results[0].jid;
        console.log(`✅ Number registered: ${recipientJid}\n`);

        // Send TEXT ONLY message
        console.log('📤 Sending TEXT message...\n');
        const message = `🎉 TEST TEXT ONLY - ${new Date().toLocaleTimeString()}

Halo! Ini adalah test pesan TEXT ONLY (tanpa gambar).

✅ Koneksi berhasil
✅ Nomor terverifikasi
✅ Pesan TEXT dikirim

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

Jika Anda menerima pesan ini, berarti:
1. WhatsApp bot terkoneksi ✅
2. Pengiriman pesan berfungsi ✅
3. Nomor Anda terdaftar ✅

🎊 SISTEM BERFUNGSI DENGAN BAIK! 🎊`;

        await sock.sendMessage(recipientJid, {
            text: message
        });

        console.log('='.repeat(70));
        console.log('✅ TEXT MESSAGE SENT SUCCESSFULLY!');
        console.log('='.repeat(70));
        console.log('\n📱 CHECK YOUR WHATSAPP NOW at:', phoneNumber);
        console.log('\nYou should receive a TEXT message immediately!');
        console.log('\n' + '='.repeat(70) + '\n');

        await delay(2000);
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

console.log('\n🚀 Starting TEXT ONLY Test...\n');
sendTextOnly();
