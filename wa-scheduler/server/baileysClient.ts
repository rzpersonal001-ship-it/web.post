import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"

export async function startBaileys() {
    const authDir = "./baileys_auth"
    const { state, saveCreds } = await useMultiFileAuthState(authDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update: any) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log("SCAN QR BERIKUT:")
            qrcode.generate(qr, { small: true })
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            console.log("Koneksi terputus. Reconnect:", shouldReconnect)
            if (shouldReconnect) startBaileys()
        }

        if (connection === "open") {
            console.log("Baileys connected!")
        }
    })

    return sock
}
