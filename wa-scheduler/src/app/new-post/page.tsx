'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

export default function NewPostPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [mediaUrl, setMediaUrl] = useState('https://picsum.photos/800/600');
  const [caption, setCaption] = useState('🤖 Test dari WA Scheduler\n\nHalo! Pesan test berhasil dikirim.\nAplikasi siap digunakan! 🎉');
  const [postingOption, setPostingOption] = useState('send-now');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  // Schedule state
  const [scheduleType, setScheduleType] =useState('ONCE');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to a service (for now, use placeholder)
    // In production, upload to cloud storage (Cloudinary, S3, etc.)
    const fakeUrl = URL.createObjectURL(file);
    setMediaUrl(fakeUrl);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
          setUploadedFile(file);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setUploadPreview(reader.result as string);
          };
          reader.readAsDataURL(file);

          const fakeUrl = URL.createObjectURL(file);
          setMediaUrl(fakeUrl);
          setMediaType('IMAGE');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const postDetails = { categoryId, mediaType, mediaUrl, caption, saveToLibrary };
    const scheduleDetails = { scheduleType, timeOfDay, startDate };

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postDetails, scheduleDetails, action: postingOption }),
    });

    if (res.ok) {
      alert('Post created successfully!');
      // Reset form or redirect
    } else {
      const error = await res.json();
      alert(`Failed to create post: ${error.message}`);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Posting Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-6 app-card p-8 shadow">
        {/* Category */}
        <div>
          <label htmlFor="category" className="block font-semibold">Kategori</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="app-input">
            <option value="">Pilih Kategori</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        {/* Media Type */}
        <div>
          <label className="block font-semibold">Jenis Media</label>
          <div className="flex gap-4">
            <label><input type="radio" value="IMAGE" checked={mediaType === 'IMAGE'} onChange={() => setMediaType('IMAGE')} /> Gambar</label>
            <label><input type="radio" value="VIDEO" checked={mediaType === 'VIDEO'} onChange={() => setMediaType('VIDEO')} /> Video</label>
          </div>
        </div>

        {/* Media URL or Upload */}
        <div>
          <label htmlFor="mediaUrl" className="block font-semibold mb-2">Media <span className="text-red-500">*</span></label>
          
          {/* Upload Button */}
          <div className="mb-3">
            <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
              📁 Upload File (Image/Video)
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="ml-3 text-sm text-gray-500">
              atau paste gambar (Ctrl+V)
            </span>
          </div>

          {/* Preview */}
          {uploadPreview && (
            <div className="mb-3 p-2 border rounded">
              <p className="text-sm font-semibold mb-2">Preview:</p>
              {mediaType === 'IMAGE' ? (
                <img src={uploadPreview} alt="Preview" className="max-w-xs max-h-48 object-contain" />
              ) : (
                <video src={uploadPreview} controls className="max-w-xs max-h-48" />
              )}
            </div>
          )}

          {/* URL Input */}
          <input 
            id="mediaUrl" 
            type="url" 
            value={mediaUrl} 
            onChange={(e) => setMediaUrl(e.target.value)} 
            onPaste={handlePaste}
            placeholder="https://picsum.photos/800/600" 
            className="app-input"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Contoh: https://picsum.photos/800/600 atau upload file di atas
          </p>
        </div>

        {/* Caption */}
        <div>
          <label htmlFor="caption" className="block font-semibold">Caption <span className="text-red-500">*</span></label>
          <textarea 
            id="caption" 
            value={caption} 
            onChange={(e) => setCaption(e.target.value)} 
            rows={5} 
            className="app-input" 
            placeholder="Tulis caption untuk post Anda..."
            required 
          />
          <p className="text-sm text-gray-500 mt-1">
            Pesan yang akan dikirim ke WhatsApp
          </p>
        </div>

        {/* Posting Options */}
        <div>
          <label className="block font-semibold">Opsi Posting</label>
          <div className="flex gap-4">
            <label><input type="radio" value="send-now" checked={postingOption === 'send-now'} onChange={() => setPostingOption('send-now')} /> Kirim sekarang</label>
            <label><input type="radio" value="schedule" checked={postingOption === 'schedule'} onChange={() => setPostingOption('schedule')} /> Masukkan ke jadwal</label>
          </div>
        </div>

        {/* Schedule Fields (Conditional) */}
        {postingOption === 'schedule' && (
          <div className="p-4 border rounded space-y-4">
            <h3 className="font-semibold">Detail Jadwal</h3>
            <div>
              <label htmlFor="scheduleType">Tipe Jadwal</label>
              <select id="scheduleType" value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="app-input">
                <option value="ONCE">Sekali</option>
                <option value="DAILY">Harian</option>
                <option value="WEEKLY">Mingguan</option>
                <option value="MONTHLY">Bulanan</option>
              </select>
            </div>
            <div>
              <label htmlFor="timeOfDay">Jam Kirim (HH:mm)</label>
              <input id="timeOfDay" type="time" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} className="app-input" />
            </div>
            <div>
              <label htmlFor="startDate">Tanggal Mulai</label>
              <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="app-input" />
            </div>
          </div>
        )}

        {/* Save to Library */}
        <div>
          <label>
            <input type="checkbox" checked={saveToLibrary} onChange={(e) => setSaveToLibrary(e.target.checked)} />
            Simpan konten ini ke Library
          </label>
        </div>

        <button type="submit" className="btn-primary">
          Simpan
        </button>

      </form>
    </div>
  );
}
