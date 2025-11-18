# 📱 Cara Logout WhatsApp Web

## ⚠️ PENTING: Logout Dulu Sebelum Kirim Bulk!

Conflict error terjadi karena ada WhatsApp Web yang aktif di device lain.

---

## 🔧 Cara Logout WhatsApp Web

### Method 1: Via HP (Paling Mudah)

1. **Buka WhatsApp di HP Anda**
2. **Tap titik 3 di kanan atas** (⋮)
3. **Pilih "Linked Devices" / "Perangkat Tertaut"**
4. **Lihat daftar device yang terkoneksi**
5. **Tap setiap device**
6. **Pilih "Log Out" / "Keluar"**
7. **Logout SEMUA device kecuali yang akan digunakan untuk bot**

### Method 2: Via Browser

1. **Buka browser yang biasa pakai WhatsApp Web**
2. **Kunjungi: https://web.whatsapp.com**
3. **Klik titik 3 di atas**
4. **Pilih "Log out"**
5. **Tutup browser**

---

## ✅ Setelah Logout, Jalankan Script Ini:

```bash
npx ts-node -P tsconfig.server.json server/sendBulk5.ts
```

**Atau gunakan script yang lebih stabil (kirim satu-satu dengan delay lebih panjang):**

```bash
npx ts-node -P tsconfig.server.json server/sendBulk5Stable.ts
```

---

## 🎯 Tips Agar Tidak Conflict:

1. **Logout dari semua WhatsApp Web**
2. **Jangan buka WhatsApp Web saat bot running**
3. **Gunakan 1 device saja untuk bot**
4. **Tunggu sampai bulk send selesai baru buka WA Web lagi**

---

## 📊 Status Saat Ini:

- ✅ Pesan 1: BERHASIL (sudah masuk ke HP Anda)
- ❌ Pesan 2-5: GAGAL (karena conflict)

**Total yang masuk: 1 pesan**

---

## 🚀 Langkah Selanjutnya:

1. **Logout WhatsApp Web** (ikuti cara di atas)
2. **Jalankan script lagi**
3. **Tunggu sampai selesai** (jangan buka WA Web)
4. **Cek HP** - 5 pesan harus masuk semua!

---

**Silakan logout WhatsApp Web dulu, lalu saya akan kirim ulang 5 pesan!** 📱
