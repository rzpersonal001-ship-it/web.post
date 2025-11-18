import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendBulk5Messages() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    
    console.log('\n' + '='.repeat(70));
    console.log('📤 BULK SEND - 5 Messages');
    console.log('='.repeat(70));
    console.log(`\n📞 Target: ${phoneNumber}`);
    console.log(`📨 Total: 5 messages\n`);

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

        console.log('📤 Verifying number...');
        const checkResults = await sock.onWhatsApp(formattedPhone);
        if (!checkResults || checkResults.length === 0 || !checkResults[0]?.exists) {
            console.error(`\n❌ Number not registered\n`);
            process.exit(1);
        }

        const recipientJid = checkResults[0].jid;
        console.log(`✅ Number verified: ${recipientJid}\n`);

        console.log('='.repeat(70));
        console.log('Starting bulk send...\n');

        const messages = [
            `📝 Pesan 1 dari 5

Halo! Ini adalah pesan pertama dari bulk send.

✅ Bulk send aktif
✅ Total 5 pesan akan dikirim

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `📝 Pesan 2 dari 5

Ini pesan kedua, dikirim otomatis dengan delay 3 detik.

✅ Sistem berfungsi dengan baik
✅ Pesan berurutan

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `📝 Pesan 3 dari 5

Sudah setengah jalan! Ini pesan ketiga.

✅ 3 dari 5 pesan terkirim
✅ Bulk send working perfectly

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `📝 Pesan 4 dari 5

Hampir selesai! Ini pesan keempat.

✅ 4 dari 5 pesan terkirim
✅ Satu lagi!

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `🎉 Pesan 5 dari 5 - SELESAI!

BERHASIL! Semua 5 pesan telah dikirim.

✅ Pesan 1: Terkirim
✅ Pesan 2: Terkirim
✅ Pesan 3: Terkirim
✅ Pesan 4: Terkirim
✅ Pesan 5: Terkirim

🎊 BULK SEND COMPLETE! 🎊

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

Terima kasih! Sistem bulk send berfungsi dengan sempurna! 🚀`
        ];

        const results = [];

        for (let i = 0; i < messages.length; i++) {
            const msgNum = i + 1;
            
            try {
                console.log(`[${msgNum}/5] Sending message ${msgNum}...`);
                
                await sock.sendMessage(recipientJid, {
                    text: messages[i]
                });
                
                console.log(`✅ Message ${msgNum} sent!\n`);
                results.push({ index: msgNum, status: 'success' });
                
                // Delay between messages (except after last message)
                if (i < messages.length - 1) {
                    console.log(`   ⏳ Waiting 3 seconds...\n`);
                    await delay(3000);
                }
                
            } catch (error: any) {
                console.error(`❌ Message ${msgNum} failed: ${error.message}\n`);
                results.push({ index: msgNum, status: 'error', error: error.message });
                
                // Still wait before next attempt
                if (i < messages.length - 1) {
                    console.log(`   ⏳ Waiting 3 seconds...\n`);
                    await delay(3000);
                }
            }
        }

        console.log('='.repeat(70));
        console.log('🎉 BULK SEND COMPLETE!');
        console.log('='.repeat(70));
        console.log('\n📊 Results:');
        results.forEach(r => {
            const icon = r.status === 'success' ? '✅' : '❌';
            console.log(`   ${icon} Message ${r.index}: ${r.status.toUpperCase()}`);
        });
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'error').length;
        
        console.log('\n📈 Summary:');
        console.log(`   ✅ Success: ${successCount}/5`);
        console.log(`   ❌ Failed: ${failCount}/5`);
        console.log(`   📊 Success Rate: ${Math.round(successCount/5*100)}%`);
        console.log('\n📱 Check WhatsApp:', phoneNumber);
        console.log('\n' + '='.repeat(70) + '\n');

        if (successCount === 5) {
            console.log('🎊 PERFECT! All 5 messages sent successfully! 🎊\n');
        }

        await delay(2000);
        sock.end(undefined);
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

console.log('\n🚀 Starting Bulk Send (5 Messages)...\n');
sendBulk5Messages();
