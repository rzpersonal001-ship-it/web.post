import { startBaileys } from "./baileysClient"

let sock: any = null

async function getClient() {
    if (!sock) sock = await startBaileys()
    return sock
}

export async function sendTextMessage(to: string, text: string) {
    const client = await getClient()
    await client.sendMessage(to, { text })
}

export async function sendImageMessage(to: string, buffer: Buffer, caption?: string) {
    const client = await getClient()
    await client.sendMessage(to, { image: buffer, caption })
}
