"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTextMessage = sendTextMessage;
exports.sendImageMessage = sendImageMessage;
const baileysClient_1 = require("./baileysClient");
const baileys_1 = require("@whiskeysockets/baileys");
// Initialize Baileys connection when this module is loaded
(0, baileysClient_1.startBaileys)().catch(err => console.error("Failed to start Baileys:", err));
function formatPhoneNumber(number) {
    if (number.endsWith("@s.whatsapp.net")) {
        return number;
    }
    return `${number}@s.whatsapp.net`;
}
async function sendTextMessage(number, message) {
    const sock = (0, baileysClient_1.getSocket)();
    const jid = formatPhoneNumber(number);
    try {
        await sock.presenceSubscribe(jid);
        await (0, baileys_1.delay)(500); // Wait for presence update
        await sock.sendPresenceUpdate('composing', jid);
        await (0, baileys_1.delay)(1000); // Simulate typing
        await sock.sendPresenceUpdate('paused', jid);
        await sock.sendMessage(jid, { text: message });
        console.log(`Message sent to ${number}`);
    }
    catch (error) {
        console.error(`Failed to send message to ${number}:`, error);
        throw new Error(`Failed to send message: ${error}`);
    }
}
async function sendImageMessage(number, image, caption) {
    const sock = (0, baileysClient_1.getSocket)();
    const jid = formatPhoneNumber(number);
    try {
        await sock.presenceSubscribe(jid);
        await (0, baileys_1.delay)(500);
        await sock.sendPresenceUpdate('composing', jid);
        await (0, baileys_1.delay)(1000);
        await sock.sendPresenceUpdate('paused', jid);
        await sock.sendMessage(jid, {
            image: image,
            caption: caption,
        });
        console.log(`Image message sent to ${number}`);
    }
    catch (error) {
        console.error(`Failed to send image message to ${number}:`, error);
        throw new Error(`Failed to send image message: ${error}`);
    }
}
