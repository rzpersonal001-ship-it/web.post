# 📱 Cara Mengirim Pesan ke 0895339581136

## ✅ WhatsApp Sudah Terkoneksi!

Bot WhatsApp sudah aktif dan terkoneksi. Sekarang ada 2 cara mudah untuk mengirim pesan:

---

## 🎯 Cara 1: Via Dashboard Web (PALING MUDAH)

### Step 1: Buka Dashboard
Buka browser: **http://localhost:3000**

### Step 2: Buat Post Baru
1. Klik **"New Post"** atau **"Create Post"**
2. Isi form:
   ```
   Caption: 🤖 Test dari WA Scheduler
   
   Halo! Pesan test berhasil dikirim.
   Aplikasi siap digunakan! 🎉
   
   Media Type: IMAGE (opsional)
   Media URL: https://picsum.photos/800/600 (opsional)
   ```

### Step 3: Kirim Sekarang
1. Pilih action: **"Send Now"**
2. Klik **Submit**
3. Pesan akan langsung terkirim!

---

## 🎯 Cara 2: Via API Endpoint

### Step 1: Pastikan Bot Masih Running
Bot di terminal harus tetap running (jangan ditutup)

### Step 2: Jalankan API Server (Terminal Baru)
```bash
npm run api
```

### Step 3: Kirim Pesan via PowerShell (Terminal Baru Lagi)
```powershell
$body = @{
    phone = "0895339581136"
    message = "🤖 Test dari WA Scheduler!`n`nHalo! Pesan berhasil dikirim.`n`nAplikasi siap digunakan! 🎉"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/send" -Method Post -Body $body -ContentType "application/json"
```

---

## ⚠️ Troubleshooting

### Problem: "Connection Closed" Error
**Penyebab:** Multiple bot instances berjalan bersamaan

**Solusi:**
1. Tutup semua terminal yang menjalankan bot
2. Hapus session lama:
   ```bash
   rm -rf baileys_auth_info
   ```
3. Jalankan ulang bot:
   ```bash
   npm run bot
   ```
4. Scan QR code lagi
5. Gunakan Cara 1 (Dashboard) untuk kirim pesan

### Problem: Bot tidak merespon
**Solusi:**
1. Cek apakah terminal bot masih running
2. Lihat log di terminal bot
3. Restart bot jika perlu

---

## 🎯 Rekomendasi

**Gunakan Dashboard Web (Cara 1)** karena:
- ✅ Paling mudah dan user-friendly
- ✅ Tidak perlu command line
- ✅ Visual interface yang jelas
- ✅ Bisa upload media
- ✅ Bisa schedule posting

---

## 📝 Contoh Pesan yang Akan Dikirim

```
🤖 Test dari WA Scheduler

Halo! Pesan test berhasil dikirim.

✅ Aplikasi running
✅ Database connected
✅ WhatsApp active

Aplikasi siap digunakan! 🎉
```

---

## 🚀 Setelah Berhasil Kirim

Anda bisa mulai menggunakan fitur-fitur lain:
- 📝 Buat library konten
- 📅 Schedule posting otomatis (daily/weekly/monthly)
- 📊 Monitor scheduled jobs
- 💬 Kirim pesan dengan media (gambar/video)

---

**Nomor Tujuan: 0895339581136**

Silakan coba kirim pesan sekarang via Dashboard! 🎉
