# 🔍 Debug: Post Validation Failed

## Masalah
Error: `POST /api/posts 400 - Post validation failed`

## Analisa
Validasi di `/api/posts/route.ts` line 42-49 memeriksa:
- caption (required)
- mediaType (required)
- mediaUrl (required)

## Kemungkinan Penyebab
1. **mediaUrl kosong** - Field ini required tapi user mungkin tidak mengisi
2. **categoryId kosong** - Dikirim sebagai empty string

## Solusi
Buat mediaUrl menjadi optional atau berikan default value.

## Testing
Coba kirim dengan data:
```json
{
  "postDetails": {
    "caption": "Test",
    "mediaType": "IMAGE",
    "mediaUrl": "https://picsum.photos/800/600",
    "categoryId": null
  },
  "action": "send-now"
}
```
