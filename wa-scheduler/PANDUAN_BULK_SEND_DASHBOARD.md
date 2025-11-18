# 📤 Panduan Bulk Send via Dashboard

**URL:** http://localhost:3000/bulk-send

---

## 🚀 Cara Menggunakan

### Step 1: Buka Dashboard
1. Browser sudah terbuka otomatis
2. Atau buka manual: http://localhost:3000
3. Klik menu **"📤 Kirim Banyak"** di sidebar

### Step 2: Tambah Pesan
1. Klik tombol **"➕ Tambah Pesan Baru"**
2. Isi form untuk setiap pesan:
   - **Jenis Media:** Pilih IMAGE atau VIDEO
   - **Media URL:** Paste URL gambar/video
   - **Caption:** Tulis pesan Anda

### Step 3: Ulangi untuk 5 Pesan
Tambah 5 pesan dengan data berikut:

#### Pesan 1:
- **Media URL:** `https://picsum.photos/800/600?random=1`
- **Caption:**
```
📝 Pesan 1 dari 5 (via Dashboard)

Halo! Ini pesan pertama dari bulk send dashboard.

✅ Dashboard berfungsi
✅ 5 pesan akan dikirim

Waktu: [otomatis]
```

#### Pesan 2:
- **Media URL:** `https://picsum.photos/800/600?random=2`
- **Caption:**
```
📝 Pesan 2 dari 5 (via Dashboard)

Ini pesan kedua dari dashboard.

✅ Sistem berjalan lancar
✅ Pesan berurutan

Waktu: [otomatis]
```

#### Pesan 3:
- **Media URL:** `https://picsum.photos/800/600?random=3`
- **Caption:**
```
📝 Pesan 3 dari 5 (via Dashboard)

Sudah setengah jalan!

✅ 3 dari 5 terkirim
✅ Dashboard working

Waktu: [otomatis]
```

#### Pesan 4:
- **Media URL:** `https://picsum.photos/800/600?random=4`
- **Caption:**
```
📝 Pesan 4 dari 5 (via Dashboard)

Hampir selesai!

✅ 4 dari 5 terkirim
✅ Satu lagi!

Waktu: [otomatis]
```

#### Pesan 5:
- **Media URL:** `https://picsum.photos/800/600?random=5`
- **Caption:**
```
🎉 Pesan 5 dari 5 (via Dashboard) - SELESAI!

BERHASIL! Semua pesan terkirim via dashboard!

✅ Pesan 1: Terkirim
✅ Pesan 2: Terkirim
✅ Pesan 3: Terkirim
✅ Pesan 4: Terkirim
✅ Pesan 5: Terkirim

🎊 BULK SEND DASHBOARD COMPLETE! 🎊
```

### Step 4: Kirim Semua
1. Pastikan semua 5 pesan sudah diisi
2. Klik tombol **"📤 Kirim Semua (5 pesan)"**
3. Tunggu proses selesai
4. Lihat hasil di bagian bawah

---

## ⚙️ Technical Details

### How It Works:
1. Dashboard → API `/api/posts` (action: send-now)
2. API → `baileysServiceSimple.ts`
3. Service → Create temp file with message data
4. Execute → `server/sendMessageFromFile.ts`
5. Script → Send via Baileys
6. Return → Success/Error to dashboard

### Delay Between Messages:
- Otomatis 5 detik antar pesan
- Mencegah conflict
- Memastikan delivery

---

## 📊 Expected Results

Setelah klik "Kirim Semua", Anda akan melihat:

```
📊 Hasil Pengiriman

✅ Pesan #1: Message sent!
✅ Pesan #2: Message sent!
✅ Pesan #3: Message sent!
✅ Pesan #4: Message sent!
✅ Pesan #5: Message sent!

✅ Selesai! 5/5 pesan berhasil dikirim
```

---

## 🐛 Troubleshooting

### Jika Ada Error:

**Error: "Connection timeout"**
- Session mungkin expired
- Jalankan: `npx ts-node -P tsconfig.server.json server/connectAndSend5.ts`
- Scan QR code lagi

**Error: "Number not registered"**
- Cek nomor di database
- Pastikan format: 0895339581136

**Error: "Failed to send"**
- Cek koneksi internet
- Cek WhatsApp aktif
- Logout WhatsApp Web lain

---

## 💡 Tips

1. **Isi semua field** sebelum kirim
2. **Jangan refresh page** saat mengirim
3. **Tunggu sampai selesai** (bisa 30-40 detik)
4. **Cek hasil** di bagian bawah page
5. **Screenshot hasil** untuk dokumentasi

---

## ✅ Checklist

Sebelum klik "Kirim Semua":

- [ ] 5 pesan sudah ditambahkan
- [ ] Semua media URL diisi
- [ ] Semua caption diisi
- [ ] Server running (npm run dev)
- [ ] WhatsApp session aktif
- [ ] Tidak ada WhatsApp Web lain

---

**Silakan coba sekarang di dashboard!** 🚀

Browser: http://localhost:3000/bulk-send
