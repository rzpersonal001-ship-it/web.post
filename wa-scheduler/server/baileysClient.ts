import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";

let sock: WASocket | undefined;

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("QR Code diterima, silakan pindai:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "Koneksi ditutup karena:",
        lastDisconnect?.error,
        ", menyambungkan kembali:",
        shouldReconnect
      );
      if (shouldReconnect) {
        startBaileys();
      }
    } else if (connection === "open") {
      console.log("Koneksi WhatsApp terbuka");
    }
  });

  return sock;
}

function getSocket(): WASocket {
    if (!sock) {
      throw new Error("Baileys client is not initialized. Call startBaileys() first.");
    }
    return sock;
}

export { startBaileys, getSocket };
