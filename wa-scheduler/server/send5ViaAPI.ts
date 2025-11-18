import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

interface Message {
    caption: string;
    mediaUrl: string;
    mediaType: 'IMAGE' | 'VIDEO';
}

const messages: Message[] = [
    {
        caption: `📝 Pesan 1 dari 5: TEXT + IMAGE

Halo! Ini adalah pesan pertama dari bulk send test.

✅ Bulk send via API
✅ 5 pesan akan dikirim
✅ Lebih stabil tanpa conflict

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600?random=1',
        mediaType: 'IMAGE'
    },
    {
        caption: `📝 Pesan 2 dari 5: IMAGE

Ini pesan kedua dengan gambar berbeda.

✅ Pesan berurutan
✅ Delay otomatis
✅ Via API endpoint

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600?random=2',
        mediaType: 'IMAGE'
    },
    {
        caption: `🖼️ Pesan 3 dari 5: IMAGE

Ini pesan ketiga, masih gambar.

✅ Gambar berhasil dikirim
✅ Caption berfungsi
✅ Bulk send working!

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600?random=3',
        mediaType: 'IMAGE'
    },
    {
        caption: `📝 Pesan 4 dari 5: IMAGE

Hampir selesai! Ini pesan keempat.

✅ 4 dari 5 pesan terkirim
✅ Satu lagi!
✅ Sistem stabil

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}`,
        mediaUrl: 'https://picsum.photos/800/600?random=4',
        mediaType: 'IMAGE'
    },
    {
        caption: `🎉 Pesan 5 dari 5: IMAGE (FINAL)

SELESAI! Ini pesan terakhir.

✅ 5 pesan berhasil dikirim!
✅ Bulk send complete!
✅ Semua via API endpoint

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' })}

🎊 Terima kasih! 🎊`,
        mediaUrl: 'https://picsum.photos/800/600?random=5',
        mediaType: 'IMAGE'
    }
];

async function sendMessage(message: Message, index: number): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[${index}/5] Sending ${message.mediaType}...`);
        
        const postDetails = {
            categoryId: '', // Will use default
            mediaType: message.mediaType,
            mediaUrl: message.mediaUrl,
            caption: message.caption,
            saveToLibrary: false
        };

        const response = await axios.post('http://localhost:3000/api/posts', {
            postDetails,
            scheduleDetails: {},
            action: 'send-now'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        if (response.status === 200 || response.status === 201) {
            console.log(`✅ Message ${index} sent successfully!\n`);
            return { success: true };
        } else {
            console.error(`❌ Message ${index} failed: ${response.statusText}\n`);
            return { success: false, error: response.statusText };
        }
        
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error(`❌ Message ${index} failed: ${errorMsg}\n`);
        return { success: false, error: errorMsg };
    }
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('📤 BULK SEND VIA API - 5 Messages');
    console.log('='.repeat(70));
    console.log(`\n📞 Target: 0895339581136 (via WhatsApp config)`);
    console.log(`📨 Total: ${messages.length} messages`);
    console.log(`🔗 API: http://localhost:3000/api/posts\n`);

    console.log('⚠️  IMPORTANT: Make sure:');
    console.log('   1. Server is running (npm run dev)');
    console.log('   2. WhatsApp is connected');
    console.log('   3. No other scripts running\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('='.repeat(70));
    console.log('Starting bulk send...\n');

    const results = [];

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const msgNum = i + 1;
        
        const result = await sendMessage(msg, msgNum);
        results.push({ index: msgNum, ...result, type: msg.mediaType });
        
        // Delay between messages
        if (i < messages.length - 1) {
            console.log(`   ⏳ Waiting 5 seconds before next message...\n`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log('='.repeat(70));
    console.log('🎉 BULK SEND COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📊 Detailed Results:');
    results.forEach(r => {
        const icon = r.success ? '✅' : '❌';
        const typeIcon = r.type === 'IMAGE' ? '🖼️' : '🎬';
        console.log(`   ${icon} Message ${r.index} (${typeIcon} ${r.type}): ${r.success ? 'SUCCESS' : 'FAILED'}`);
        if (r.error) {
            console.log(`      Error: ${r.error}`);
        }
    });
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ Success: ${successCount}/${results.length}`);
    console.log(`   ❌ Failed: ${failCount}/${results.length}`);
    console.log(`   📊 Success Rate: ${Math.round(successCount/results.length*100)}%`);
    console.log('\n📱 Check WhatsApp: 0895339581136');
    console.log('\n' + '='.repeat(70) + '\n');

    if (successCount === results.length) {
        console.log('🎊 PERFECT! All 5 messages sent successfully! 🎊\n');
    } else if (successCount > 0) {
        console.log(`⚠️  ${successCount} messages sent, ${failCount} failed. Check errors above.\n`);
    } else {
        console.log('❌ All messages failed. Check server and WhatsApp connection.\n');
    }
}

console.log('\n🚀 Starting 5 Messages Bulk Send via API...\n');
main().catch(console.error);
