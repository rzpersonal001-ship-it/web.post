import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function testSend1() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('📤 TEST KIRIM 1 PESAN');
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
            const timeout = setTimeout(() => resolve(false), 30000);

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

        console.log('📤 Verifying number...');
        const checkResults = await sock.onWhatsApp(formattedPhone);
        if (!checkResults || checkResults.length === 0 || !checkResults[0]?.exists) {
            console.error(`\n❌ Number not registered\n`);
            process.exit(1);
        }

        const recipientJid = checkResults[0].jid;
        console.log(`✅ Number verified: ${recipientJid}\n`);

        console.log('='.repeat(70));
        console.log('Sending message...\n');

        const message = `🧪 TEST PESAN - ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

Halo! Ini adalah test pesan untuk memastikan sistem berfungsi.

✅ Koneksi: OK
✅ Session: Aktif
✅ Pengiriman: Berhasil

Waktu: ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Pontianak' })}

Jika Anda menerima pesan ini, berarti sistem WhatsApp scheduler berfungsi dengan sempurna! 🎉`;

        console.log('📨 Sending...');
        
        await sock.sendMessage(recipientJid, {
            text: message
        });
        
        console.log('✅ Message sent successfully!\n');

        console.log('='.repeat(70));
        console.log('🎉 TEST COMPLETE!');
        console.log('='.repeat(70));
        console.log('\n📊 Result: SUCCESS ✅');
        console.log('📱 Check WhatsApp:', phoneNumber);
        console.log('\n' + '='.repeat(70) + '\n');

        await delay(2000);
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

console.log('\n🚀 Starting test send...\n');
testSend1();
