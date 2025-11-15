import { startBaileys } from "./baileysClient";
let sock: any;

(async () => {
sock = await startBaileys();
})();

export async function sendTextMessage(number: string, message: string) {
await sock.sendMessage(number + "@s.whatsapp.net", {
text: message
});
}

export async function sendImageMessage(number: string, image: Buffer, caption: string) {
await sock.sendMessage(number + "@s.whatsapp.net", {
image,
caption
});
}
