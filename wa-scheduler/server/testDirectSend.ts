import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendDirectMessage() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('📱 TEST DIRECT SEND - Single Message');
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

        // Download image
        console.log('📥 Downloading image...');
        const imageUrl = 'https://picsum.photos/800/600?random=test';
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(response.data);
        console.log(`✅ Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

        // Send message
        console.log('📤 Sending message...\n');
        const caption = `🎉 TEST DIRECT SEND

Ini adalah test pesan langsung dari script.

✅ Koneksi berhasil
✅ Gambar berhasil didownload
✅ Pesan sedang dikirim...

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

Jika Anda menerima pesan ini, berarti sistem berfungsi dengan baik! 🎊`;

        await sock.sendMessage(recipientJid, {
            image: imageBuffer,
            caption: caption
        });

        console.log('='.repeat(70));
        console.log('✅ MESSAGE SENT SUCCESSFULLY!');
        console.log('='.repeat(70));
        console.log('\n📱 Check your WhatsApp at:', phoneNumber);
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

console.log('\n🚀 Starting Direct Send Test...\n');
sendDirectMessage();
