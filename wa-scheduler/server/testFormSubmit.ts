import axios from 'axios';

async function testFormSubmit() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 Testing Form Submit');
  console.log('='.repeat(70) + '\n');

  const testData = {
    postDetails: {
      caption: '🤖 Test dari WA Scheduler\n\nHalo! Pesan test berhasil dikirim.\nAplikasi siap digunakan! 🎉',
      mediaType: 'IMAGE',
      mediaUrl: 'https://picsum.photos/800/600',
      categoryId: null,
      saveToLibrary: true,
    },
    scheduleDetails: {
      scheduleType: 'ONCE',
      timeOfDay: '09:00',
      startDate: new Date().toISOString().split('T')[0],
    },
    action: 'save', // Just save, don't send
  };

  console.log('📤 Sending test data...\n');
  console.log('Data:', JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    const response = await axios.post('http://localhost:3000/api/posts', testData, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 201) {
      console.log('✅ SUCCESS! Post created successfully!\n');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('\n' + '='.repeat(70));
      console.log('🎉 Form validation is working correctly!');
      console.log('='.repeat(70) + '\n');
      process.exit(0);
    }
  } catch (error: any) {
    if (error.response) {
      console.log('❌ ERROR! Post creation failed\n');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      console.log('Errors:', error.response.data.errors);
      console.log('\n' + '='.repeat(70));
      console.log('⚠️  Form validation needs more fixes');
      console.log('='.repeat(70) + '\n');
    } else {
      console.error('❌ Network error:', error.message);
    }
    process.exit(1);
  }
}

testFormSubmit();
