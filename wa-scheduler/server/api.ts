import express from 'express';
import { sendTextMessage } from './whatsappServiceBaileys';

const app = express();
app.use(express.json());

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
    await sendTextMessage(phone, message);
    console.log(`[API] Message sent successfully to ${phone}`);
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('[API] Failed to send message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log(`[API] Server is running on port ${PORT}`);
});
