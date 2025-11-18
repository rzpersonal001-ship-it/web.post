import { sendTextMessage } from './whatsappServiceBaileys';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function sendMessage() {
  const phoneNumber = '0895339581136';
  
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
  console.log(`\n📞 Nomor tujuan: ${phoneNumber}`);
  console.log('📤 Mengirim pesan...\n');

  try {
    await sendTextMessage(phoneNumber, message);
    
    console.log('✅ PESAN BERHASIL DIKIRIM!\n');
    console.log('='.repeat(70));
    console.log('📨 Isi Pesan:');
    console.log('='.repeat(70));
    console.log(message);
    console.log('='.repeat(70));
    console.log('\n🎉 Pengiriman selesai! Cek WhatsApp Anda.\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Pastikan bot masih running di terminal lain!\n');
    process.exit(1);
  }
}

sendMessage();
