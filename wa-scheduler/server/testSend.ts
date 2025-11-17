import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env', override: true });

async function main() {
  const phone = process.env.WHATSAPP_TEST_PHONE;
  const message = `[TEST] This is a test message from testSend.ts at ${new Date().toLocaleTimeString()}`;
  const port = process.env.API_PORT || 3001;
  const url = `http://localhost:${port}/send`;

  console.log('--- Environment Variables ---');
  console.log(`WHATSAPP_TEST_PHONE: ${phone}`);
  console.log(`API_PORT: ${port}`);
  console.log('---------------------------');

  if (!phone) {
    console.error('WHATSAPP_TEST_PHONE is not defined in your .env file.');
    return;
  }

  console.log(`Sending test message to ${phone} via ${url}...`);

  try {
    const response = await axios.post(url, {
      phone,
      message,
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Test message sent successfully!');
    } else {
      console.error(`❌ Failed to send test message. Status: ${response.status}`, response.data);
    }
  } catch (err: any) {
    console.error('❌ An error occurred while sending the test message:');
    if (err.response) {
      console.error(`   - Status: ${err.response.status}`);
      console.error('   - Data:', err.response.data);
    } else {
      console.error('   - Error:', err.message);
    }
    console.log("   - Hint: Is the API server running? Try 'pm2 logs wa-api'.");
  }
}

main();
