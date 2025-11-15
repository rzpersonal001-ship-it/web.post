import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

export async function startBaileys() {
const { state, saveCreds } = await useMultiFileAuthState("auth");

const sock = makeWASocket({
printQRInTerminal: false,
auth: state,
});

sock.ev.on("connection.update", (update: any) => {
const { connection, qr } = update;

if (qr) {
qrcode.generate(qr, { small: true });
}

if (connection === "close") {
const reason = update.lastDisconnect?.error?.output?.statusCode;
if (reason === DisconnectReason.loggedOut) {
startBaileys();
}
}
});

sock.ev.on("creds.update", saveCreds);

return sock;
}
