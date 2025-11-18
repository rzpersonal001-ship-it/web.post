import axios from 'axios';
import prisma from '../src/lib/db';

async function sendImageViaAPI() {
    console.log('\n' + '='.repeat(70));
    console.log('🎨 Mengirim Gambar via Dashboard API');
    console.log('='.repeat(70) + '\n');

    const postData = {
        postDetails: {
            caption: `🎨 Test Image dari WA Scheduler

Halo! Ini adalah pesan dengan gambar.

✅ Aplikasi berhasil running
✅ Database terkoneksi  
✅ WhatsApp Bot aktif
✅ Pesan dengan gambar berhasil dikirim!

Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Pontianak',
  dateStyle: 'full',
  timeStyle: 'long'
})}

🎉 Fitur kirim gambar berfungsi dengan baik!

Dashboard: http://localhost:3000`,
            mediaType: 'IMAGE',
            mediaUrl: 'https://picsum.photos/800/600',
            categoryId: null,
            saveToLibrary: true,
        },
        scheduleDetails: {},
        action: 'save', // Save to database
    };

    console.log('📤 Membuat post dengan gambar...\n');

    try {
        // Create post via API
        const response = await axios.post('http://localhost:3000/api/posts', postData, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 201) {
            const post = response.data.post;
            console.log('✅ Post berhasil dibuat!\n');
            console.log('📋 Post ID:', post.id);
            console.log('🖼️  Media URL:', post.mediaUrl);
            console.log('📝 Caption:', post.caption.substring(0, 50) + '...');
            
            console.log('\n' + '='.repeat(70));
            console.log('✅ POST DENGAN GAMBAR BERHASIL DIBUAT!');
            console.log('='.repeat(70));
            console.log('\n📊 Data tersimpan di database');
            console.log('🌐 Lihat di dashboard: http://localhost:3000/library');
            console.log('\n💡 Untuk mengirim via WhatsApp:');
            console.log('   1. Pastikan bot WhatsApp aktif');
            console.log('   2. Gunakan opsi "Send Now" di dashboard');
            console.log('   3. Atau gunakan scheduler untuk kirim otomatis\n');
            console.log('='.repeat(70) + '\n');
            
            process.exit(0);
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.response?.data?.message || error.message);
        process.exit(1);
    }
}

sendImageViaAPI();
