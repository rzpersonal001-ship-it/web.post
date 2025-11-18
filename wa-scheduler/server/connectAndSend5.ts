import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    delay 
} from "@whiskeysockets/baileys";
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function connectAndSend5() {
    const phoneNumber = '0895339581136';
    const authDir = './baileys_auth_info';
    const qrImagePath = path.join(process.cwd(), 'public', 'whatsapp-qr.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('📱 CONNECT & SEND 5 Messages');
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

        let isConnected = false;

        sock.ev.on("connection.update", async (update: any) => {
            const { connection, qr } = update;

            if (qr) {
                console.log('📱 QR Code generated!');
                try {
                    await QRCode.toFile(qrImagePath, qr, { width: 400 });
                    console.log('   Saved to: public/whatsapp-qr.png');
                    console.log('   URL: http://localhost:3000/whatsapp-qr.png');
                    console.log('\n⏳ Please scan QR code with your phone...\n');
                } catch (err) {
                    console.error('Error saving QR:', err);
                }
            }

            if (connection === "open") {
                isConnected = true;
                console.log('✅ Connected to WhatsApp!\n');
                
                if (fs.existsSync(qrImagePath)) {
                    fs.unlinkSync(qrImagePath);
                }
            }

            if (connection === "close") {
                isConnected = false;
                console.log('❌ Connection closed\n');
            }
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout - QR not scanned'));
            }, 60000);

            const checkInterval = setInterval(() => {
                if (isConnected) {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        await delay(3000);

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
✅ Session baru terkoneksi

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `📝 Pesan 2 dari 5

Ini pesan kedua, dikirim otomatis dengan delay 4 detik.

✅ Sistem berfungsi dengan baik
✅ Pesan berurutan
✅ Tidak ada conflict

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `📝 Pesan 3 dari 5

Sudah setengah jalan! Ini pesan ketiga.

✅ 3 dari 5 pesan terkirim
✅ Bulk send working perfectly
✅ Session stabil

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,

            `📝 Pesan 4 dari 5

Hampir selesai! Ini pesan keempat.

✅ 4 dari 5 pesan terkirim
✅ Satu lagi!
✅ Koneksi lancar

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
                
                // Longer delay to avoid any issues
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

console.log('\n🚀 Starting Connect & Send 5 Messages...\n');
console.log('⏳ Generating QR code...\n');
connectAndSend5();
