import { baileysClient } from './baileysClient';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendDirectMessage() {
  const phoneNumber = process.env.WHATSAPP_TEST_PHONE || '0895339581136';
  const message = `🤖 Test Message from WA Scheduler

Halo! Ini adalah pesan test otomatis dari aplikasi WA Content Scheduler.

✅ Aplikasi berhasil running
✅ Database terkoneksi
✅ Baileys WhatsApp client aktif

Waktu pengiriman: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

Aplikasi siap digunakan! 🎉`;

  console.log('='.repeat(60));
  console.log('📱 Mengirim Pesan WhatsApp');
  console.log('='.repeat(60));
  console.log(`Nomor tujuan: ${phoneNumber}`);
  console.log('\n⏳ Menghubungkan ke WhatsApp...\n');

  try {
    // Get Baileys socket
    const sock = await baileysClient.getSocket();
    
    if (!sock) {
      console.error('❌ Gagal mendapatkan koneksi WhatsApp');
      console.log('\n💡 Pastikan Anda sudah scan QR code!');
      process.exit(1);
    }

    console.log('✅ Koneksi WhatsApp berhasil!\n');
    console.log('📤 Mengirim pesan...\n');

    // Format phone number to WhatsApp format
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    // Add country code if not present
    if (!formattedPhone.startsWith('62')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1);
      } else {
        formattedPhone = '62' + formattedPhone;
      }
    }

    console.log(`Nomor terformat: ${formattedPhone}`);

    // Check if number is registered on WhatsApp
    const results = await sock.onWhatsApp(formattedPhone);
    
    if (!results || results.length === 0 || !results[0]?.exists) {
      console.error(`❌ Nomor ${phoneNumber} tidak terdaftar di WhatsApp`);
      process.exit(1);
    }

    const recipientJid = results[0].jid;
    console.log(`JID: ${recipientJid}\n`);

    // Send message
    await sock.sendMessage(recipientJid, { text: message });

    console.log('✅ Pesan berhasil dikirim!\n');
    console.log('='.repeat(60));
    console.log('📨 Detail Pesan:');
    console.log('='.repeat(60));
    console.log(message);
    console.log('='.repeat(60));
    console.log('\n🎉 Pengiriman selesai!\n');

    // Don't exit immediately, give time for message to be sent
    setTimeout(() => {
      process.exit(0);
    }, 2000);

  } catch (error: any) {
    console.error('\n❌ Error saat mengirim pesan:');
    console.error(error.message);
    
    if (error.message.includes('not connected')) {
      console.log('\n💡 Solusi:');
      console.log('1. Jalankan: npm run bot');
      console.log('2. Scan QR code dengan WhatsApp Anda');
      console.log('3. Tunggu sampai koneksi berhasil');
      console.log('4. Jalankan script ini lagi\n');
    }
    
    process.exit(1);
  }
}

// Run the function
sendDirectMessage();
