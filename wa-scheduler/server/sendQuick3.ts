import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendQuick3() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('📤 QUICK SEND - 3 Messages with Images');
    console.log('='.repeat(70));
    console.log(`\n📞 Target: ${phoneNumber}`);
    console.log(`📨 Total: 3 messages\n`);

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
        console.log('Starting send...\n');

        const messages = [
            {
                imageUrl: 'https://picsum.photos/800/600?random=101',
                caption: `📝 Pesan 1 dari 3 (Quick Send)

Halo! Ini pesan pertama dengan gambar.

✅ Gambar dari internet
✅ Caption berfungsi
✅ Dikirim via script

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
            },
            {
                imageUrl: 'https://picsum.photos/800/600?random=102',
                caption: `📝 Pesan 2 dari 3 (Quick Send)

Ini pesan kedua dengan gambar berbeda.

✅ Sistem berjalan lancar
✅ Gambar random
✅ Pesan berurutan

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
            },
            {
                imageUrl: 'https://picsum.photos/800/600?random=103',
                caption: `🎉 Pesan 3 dari 3 (Quick Send) - SELESAI!

BERHASIL! Semua 3 pesan dengan gambar terkirim!

✅ Pesan 1: Terkirim
✅ Pesan 2: Terkirim
✅ Pesan 3: Terkirim

🎊 QUICK SEND COMPLETE! 🎊

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`
            }
        ];

        const results = [];

        for (let i = 0; i < messages.length; i++) {
            const msgNum = i + 1;
            const msg = messages[i];
            
            try {
                console.log(`[${msgNum}/3] Downloading image ${msgNum}...`);
                
                const response = await axios.get(msg.imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                const imageBuffer = Buffer.from(response.data);
                console.log(`   Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
                
                console.log(`[${msgNum}/3] Sending message ${msgNum}...`);
                
                await sock.sendMessage(recipientJid, {
                    image: imageBuffer,
                    caption: msg.caption
                });
                
                console.log(`✅ Message ${msgNum} sent!\n`);
                results.push({ index: msgNum, status: 'success' });
                
                if (i < messages.length - 1) {
                    console.log(`   ⏳ Waiting 4 seconds...\n`);
                    await delay(4000);
                }
                
            } catch (error: any) {
                console.error(`❌ Message ${msgNum} failed: ${error.message}\n`);
                results.push({ index: msgNum, status: 'error', error: error.message });
                
                if (i < messages.length - 1) {
                    console.log(`   ⏳ Waiting 4 seconds...\n`);
                    await delay(4000);
                }
            }
        }

        console.log('='.repeat(70));
        console.log('🎉 QUICK SEND COMPLETE!');
        console.log('='.repeat(70));
        console.log('\n📊 Results:');
        results.forEach(r => {
            const icon = r.status === 'success' ? '✅' : '❌';
            console.log(`   ${icon} Message ${r.index}: ${r.status.toUpperCase()}`);
        });
        
        const successCount = results.filter(r => r.status === 'success').length;
        
        console.log('\n📈 Summary:');
        console.log(`   ✅ Success: ${successCount}/3`);
        console.log(`   📊 Success Rate: ${Math.round(successCount/3*100)}%`);
        console.log('\n📱 Check WhatsApp:', phoneNumber);
        console.log('\n' + '='.repeat(70) + '\n');

        if (successCount === 3) {
            console.log('🎊 PERFECT! All 3 messages with images sent! 🎊\n');
        }

        await delay(2000);
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

console.log('\n🚀 Starting Quick Send (3 Messages with Images)...\n');
sendQuick3();
