import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendDirectly() {
  const phoneNumber = '0895339581136';
  const authDir = './baileys_auth_info';
  
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
  console.log('📱 Mengirim Pesan WhatsApp');
  console.log('='.repeat(70));
  console.log(`\n📞 Nomor tujuan: ${phoneNumber}\n`);

  try {
    // Load existing auth
    const { state } = await useMultiFileAuthState(authDir);
    
    // Create socket with existing auth
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);
      
      sock.ev.on("connection.update", async (update) => {
        const { connection } = update;
        
        if (connection === "open") {
          clearTimeout(timeout);
          console.log('✅ Koneksi berhasil!\n');
          console.log('📤 Mengirim pesan...\n');
          
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
              reject(new Error('Number not registered'));
              return;
            }
            
            const recipientJid = results[0].jid;
            console.log(`   JID: ${recipientJid}\n`);
            
            // Send message
            await sock.sendMessage(recipientJid, { text: message });
            
            console.log('✅ PESAN BERHASIL DIKIRIM!\n');
            console.log('='.repeat(70));
            console.log('📨 Isi Pesan:');
            console.log('='.repeat(70));
            console.log(message);
            console.log('='.repeat(70));
            console.log('\n🎉 Cek WhatsApp Anda sekarang!\n');
            
            setTimeout(() => {
              sock.end(undefined);
              resolve();
            }, 2000);
            
          } catch (err: any) {
            clearTimeout(timeout);
            reject(err);
          }
        }
        
        if (connection === "close") {
          clearTimeout(timeout);
          reject(new Error('Connection closed'));
        }
      });
    });
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Pastikan Anda sudah scan QR code dan bot terkoneksi!\n');
    process.exit(1);
  }
}

sendDirectly();
