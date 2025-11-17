"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './.env' });
async function main() {
    const phone = process.env.WHATSAPP_TEST_PHONE;
    const message = `[TEST] This is a test message from testSend.ts at ${new Date().toLocaleTimeString()}`;
    const port = process.env.API_PORT || 3001;
    const url = `http://localhost:${port}/send`;
    if (!phone) {
        console.error('WHATSAPP_TEST_PHONE is not defined in your .env file.');
        return;
    }
    console.log(`Sending test message to ${phone} via ${url}...`);
    try {
        const response = await axios_1.default.post(url, {
            phone,
            message,
        });
        if (response.status === 200 && response.data.success) {
            console.log('✅ Test message sent successfully!');
        }
        else {
            console.error(`❌ Failed to send test message. Status: ${response.status}`, response.data);
        }
    }
    catch (err) {
        console.error('❌ An error occurred while sending the test message:');
        if (err.response) {
            console.error(`   - Status: ${err.response.status}`);
            console.error('   - Data:', err.response.data);
        }
        else {
            console.error('   - Error:', err.message);
        }
        console.log("   - Hint: Is the API server running? Try 'pm2 logs wa-api'.");
    }
}
main();
