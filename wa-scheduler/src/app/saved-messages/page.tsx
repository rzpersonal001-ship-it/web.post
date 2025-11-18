'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SavedMessage {
  id: string;
  caption: string;
  mediaUrl: string | null;
  mediaType: string;
  title: string | null;
  category: { id: string; name: string } | null;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function SavedMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchCategories();
  }, [selectedCategory]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const url = selectedCategory 
        ? `/api/saved-messages?categoryId=${selectedCategory}`
        : '/api/saved-messages';
      
      const res = await fetch(url);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleUseMessage = (message: SavedMessage) => {
    // Store in localStorage for use in bulk-send
    localStorage.setItem('selectedMessage', JSON.stringify(message));
    router.push('/bulk-send');
  };

  const handleScheduleMessage = (message: SavedMessage) => {
    localStorage.setItem('selectedMessage', JSON.stringify(message));
    router.push('/new-post?schedule=true');
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const res = await fetch(`/api/saved-messages?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const filteredMessages = messages.filter(msg =>
    msg.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">💾 Pesan Tersimpan</h1>
        <p className="text-gray-600">Gunakan kembali pesan yang pernah dikirim</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="🔍 Cari pesan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="app-input flex-1"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="app-input w-64"
        >
          <option value="">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Quick Category Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Semua
        </button>
        {categories.slice(0, 5).map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded ${selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Messages Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Belum ada pesan tersimpan</p>
          <button
            onClick={() => router.push('/new-post')}
            className="btn-primary"
          >
            Buat Pesan Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMessages.map(message => (
            <div key={message.id} className="app-card p-4 shadow hover:shadow-lg transition">
              {/* Preview */}
              {message.mediaUrl && (
                <div className="mb-3 rounded overflow-hidden bg-gray-100">
                  {message.mediaType === 'IMAGE' ? (
                    <img 
                      src={message.mediaUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <video 
                      src={message.mediaUrl} 
                      className="w-full h-48 object-cover"
                    />
                  )}
                </div>
              )}

              {/* Title */}
              <h3 className="font-semibold mb-2 truncate">
                {message.title || message.caption.substring(0, 50)}
              </h3>

              {/* Caption Preview */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {message.caption}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                {message.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {message.category.name}
                  </span>
                )}
                <span>📊 {message.usageCount}x digunakan</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleUseMessage(message)}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  ✉️ Gunakan
                </button>
                <button
                  onClick={() => handleScheduleMessage(message)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  📅 Jadwalkan
                </button>
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
