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
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [postingOption, setPostingOption] = useState('send-now');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
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

        {/* Media URL */}
        <div>
          <label htmlFor="mediaUrl" className="block font-semibold">Media URL</label>
          <input id="mediaUrl" type="text" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." className="app-input" ></input>
        </div>

        {/* Caption */}
        <div>
          <label htmlFor="caption" className="block font-semibold">Caption</label>
          <textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} className="app-input" required />
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
