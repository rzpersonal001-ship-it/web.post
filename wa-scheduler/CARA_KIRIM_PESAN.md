# 📱 Cara Mengirim Pesan WhatsApp ke 0895339581136

## ⚠️ Penting: Setup WhatsApp Baileys

Aplikasi ini menggunakan **Baileys** (WhatsApp Web API) yang memerlukan scan QR code untuk koneksi.

---

## 🚀 Langkah-Langkah Mengirim Pesan

### Opsi 1: Menggunakan Baileys Bot (Recommended)

#### Step 1: Jalankan Bot WhatsApp
```bash
npm run bot
```

#### Step 2: Scan QR Code
1. QR code akan muncul di terminal
2. Buka WhatsApp di HP Anda
3. Pilih **Linked Devices** / **Perangkat Tertaut**
4. Tap **Link a Device** / **Tautkan Perangkat**
5. Scan QR code yang muncul di terminal
6. Tunggu sampai muncul pesan "Connection opened successfully"

#### Step 3: Kirim Pesan Test
Buka terminal baru (jangan tutup terminal bot), lalu jalankan:
```bash
npm run test:send
```

Atau gunakan script khusus:
```bash
npx ts-node -P tsconfig.server.json server/sendDirectMessage.ts
```

---

### Opsi 2: Menggunakan API Server

#### Step 1: Jalankan Bot (di terminal 1)
```bash
npm run bot
```

#### Step 2: Scan QR Code
Scan QR code seperti pada Opsi 1

#### Step 3: Jalankan API Server (di terminal 2)
```bash
npm run api
```

#### Step 4: Kirim Pesan via API (di terminal 3)
```bash
curl -X POST http://localhost:3001/send -H "Content-Type: application/json" -d "{\"phone\":\"0895339581136\",\"message\":\"Test dari WA Scheduler!\"}"
```

Atau gunakan PowerShell:
```powershell
$body = @{
    phone = "0895339581136"
    message = "🤖 Test dari WA Scheduler!`n`nAplikasi berhasil running dan siap digunakan! 🎉"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/send" -Method Post -Body $body -ContentType "application/json"
```

---

### Opsi 3: Menggunakan Dashboard Web

#### Step 1: Setup Bot
Jalankan bot dan scan QR code (seperti opsi sebelumnya)

#### Step 2: Buka Dashboard
Buka browser: http://localhost:3000

#### Step 3: Buat Post Baru
1. Klik **"New Post"** atau **"Create Post"**
2. Isi form:
   - **Caption**: Pesan yang ingin dikirim
   - **Media Type**: IMAGE atau VIDEO
   - **Media URL**: URL gambar/video (opsional)
3. Pilih action: **"Send Now"**
4. Klik **Submit**

---

## 🔧 Troubleshooting

### Problem: QR Code tidak muncul
**Solusi:**
```bash
# Hapus session lama
rm -rf baileys_auth_info

# Jalankan ulang bot
npm run bot
```

### Problem: Connection Error
**Solusi:**
1. Pastikan internet stabil
2. Restart bot
3. Scan QR code lagi

### Problem: Nomor tidak terdaftar
**Solusi:**
- Pastikan nomor **0895339581136** terdaftar di WhatsApp
- Format nomor akan otomatis dikonversi ke **62895339581136**

### Problem: Message not sent
**Solusi:**
1. Cek apakah bot masih running
2. Cek log di terminal bot
3. Pastikan koneksi WhatsApp masih aktif

---

## 📝 Format Nomor

Aplikasi akan otomatis mengkonversi format nomor:
- Input: `0895339581136`
- Output: `62895339581136@s.whatsapp.net`

---

## 🎯 Quick Test Script

Saya sudah membuat script khusus untuk mengirim pesan ke nomor Anda:

```bash
# Script 1: Quick Send (dengan auto-connect)
npx ts-node -P tsconfig.server.json server/quickSend.ts

# Script 2: Direct Message (butuh bot running)
npx ts-node -P tsconfig.server.json server/sendDirectMessage.ts
```

---

## ✅ Verifikasi Pengiriman

Setelah mengirim pesan, Anda akan menerima pesan seperti ini:

```
🤖 Test dari WA Scheduler

Halo! Pesan test berhasil dikirim.

✅ Aplikasi running
✅ Database connected
✅ WhatsApp active

Waktu: [timestamp]

Aplikasi siap digunakan! 🎉
```

---

## 🔐 Keamanan

- Session WhatsApp disimpan di folder `baileys_auth_info/`
- Jangan share folder ini ke orang lain
- Folder ini sudah di-gitignore

---

## 📞 Nomor Target

**Nomor yang akan menerima pesan:**
- 0895339581136
- Format WhatsApp: 62895339581136

---

## 🎉 Selesai!

Setelah setup berhasil, Anda bisa:
1. ✅ Kirim pesan manual via dashboard
2. ✅ Schedule pesan otomatis
3. ✅ Kirim pesan via API
4. ✅ Kirim pesan via script

**Semua pesan akan dikirim ke nomor: 0895339581136**
