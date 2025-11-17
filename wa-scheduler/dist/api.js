"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsappServiceBaileys_1 = require("./whatsappServiceBaileys");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.API_PORT || 3001;
app.post('/send', async (req, res) => {
    console.log('[API] Received request on /send');
    const { phone, message } = req.body;
    if (!phone || !message) {
        console.log('[API] Bad request: phone or message missing');
        return res.status(400).json({ error: 'Phone and message are required' });
    }
    try {
        console.log(`[API] Attempting to send message to ${phone}`);
        await (0, whatsappServiceBaileys_1.sendTextMessage)(phone, message);
        console.log(`[API] Message sent successfully to ${phone}`);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    }
    catch (error) {
        console.error('[API] Failed to send message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});
app.listen(PORT, () => {
    console.log(`[API] Server is running on port ${PORT}`);
});
