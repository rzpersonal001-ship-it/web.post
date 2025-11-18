import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function quickSend() {
  const phoneNumber = '0895339581136';
  const authDir = './baileys_auth_info';

  console.log('\n🚀 Quick Send - WhatsApp Message\n');
  console.log('='.repeat(60));

  try {
    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    // Create socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('\n📱 Scan QR Code ini dengan WhatsApp Anda:\n');
        }

        if (connection === "close") {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log(`\n❌ Koneksi tertutup. Reconnect: ${shouldReconnect}\n`);
          
          if (!shouldReconnect && !resolved) {
            resolved = true;
            reject(new Error('Logged out'));
          }
        }

        if (connection === "open" && !resolved) {
          resolved = true;
          console.log('\n✅ Koneksi WhatsApp berhasil!\n');
          
          // Format phone number
          let formattedPhone = phoneNumber.replace(/\D/g, '');
          if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
          }

          console.log(`📤 Mengirim pesan ke ${phoneNumber} (${formattedPhone})...\n`);

          // Check if registered
          const results = await sock.onWhatsApp(formattedPhone);
          
          if (!results || results.length === 0 || !results[0]?.exists) {
            console.error(`❌ Nomor tidak terdaftar di WhatsApp\n`);
            resolve();
            return;
          }

          const recipientJid = results[0].jid;

          // Send message
          const message = `🤖 Test dari WA Scheduler

Halo! Pesan test berhasil dikirim.

✅ Aplikasi running
✅ Database connected
✅ WhatsApp active

Waktu: ${new Date().toLocaleString('id-ID')}

Aplikasi siap digunakan! 🎉`;

          await sock.sendMessage(recipientJid, { text: message });

          console.log('✅ Pesan berhasil dikirim!\n');
          console.log('='.repeat(60));
          console.log(message);
          console.log('='.repeat(60));
          console.log('\n🎉 Selesai!\n');

          setTimeout(() => resolve(), 2000);
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Connection timeout'));
        }
      }, 60000);
    });

    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n⏱️  Timeout - Koneksi memakan waktu terlalu lama');
      console.log('💡 Coba jalankan lagi dan scan QR code lebih cepat\n');
    }
    
    process.exit(1);
  }
}

quickSend();
