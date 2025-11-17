"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTextMessage = sendTextMessage;
exports.sendImageMessage = sendImageMessage;
const baileysClient_1 = require("./baileysClient");
async function getClient() {
    console.log('[WhatsappService] Getting Baileys socket...');
    const sock = await baileysClient_1.baileysClient.getSocket();
    if (!sock) {
        console.error('[WhatsappService] Failed to get socket.');
        throw new Error("WhatsApp client not connected");
    }
    console.log('[WhatsappService] Socket retrieved.');
    return sock;
}
async function sendTextMessage(to, text) {
    var _a;
    const sock = await getClient();
    console.log(`[WhatsappService] Sending text to ${to}`);
    const results = await sock.onWhatsApp(to);
    if (!results || results.length === 0 || !((_a = results[0]) === null || _a === void 0 ? void 0 : _a.exists)) {
        throw new Error(`Phone number is not registered on WhatsApp: ${to}`);
    }
    const recipientJid = results[0].jid;
    await sock.sendMessage(recipientJid, { text });
    console.log(`[WhatsappService] Message sent to ${to}`);
}
async function sendImageMessage(to, buffer, caption) {
    var _a;
    const sock = await getClient();
    console.log(`[WhatsappService] Sending image to ${to}`);
    const results = await sock.onWhatsApp(to);
    if (!results || results.length === 0 || !((_a = results[0]) === null || _a === void 0 ? void 0 : _a.exists)) {
        throw new Error(`Phone number is not registered on WhatsApp: ${to}`);
    }
    const recipientJid = results[0].jid;
    await sock.sendMessage(recipientJid, { image: buffer, caption });
    console.log(`[WhatsappService] Image sent to ${to}`);
}
