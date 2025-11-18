'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

interface BulkMessage {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  categoryId?: string;
}

export default function BulkSendPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<BulkMessage[]>([
    { id: '1', caption: '', mediaUrl: '', mediaType: 'TEXT', categoryId: '' }
  ]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string>('');

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  const addMessage = () => {
    const newId = (messages.length + 1).toString();
    setMessages([...messages, { id: newId, caption: '', mediaUrl: '', mediaType: 'TEXT', categoryId: '' }]);
  };

  const removeMessage = (id: string) => {
    if (messages.length > 1) {
      setMessages(messages.filter(m => m.id !== id));
    }
  };

  const updateMessage = (id: string, field: keyof BulkMessage, value: any) => {
    setMessages(messages.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
        return;
      }

      const { url } = await response.json();
      
      // Update with server URL
      updateMessage(id, 'mediaUrl', `http://localhost:3000${url}`);
      
      // Detect type
      if (file.type.startsWith('video/')) {
        updateMessage(id, 'mediaType', 'VIDEO');
      } else {
        updateMessage(id, 'mediaType', 'IMAGE');
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (id: string, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const url = URL.createObjectURL(blob);
          updateMessage(id, 'mediaUrl', url);
          updateMessage(id, 'mediaType', 'IMAGE');
        }
      }
    }
  };

  const sendAllMessages = async () => {
    setSending(true);
    setResults([]);
    
    const sendResults = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      try {
        console.log(`Sending message ${i + 1}/${messages.length}...`);
        
        const postDetails = {
          categoryId: categories[0]?.id || '',
          mediaType: msg.mediaType,
          mediaUrl: msg.mediaUrl,
          caption: msg.caption,
          saveToLibrary: false
        };

        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            postDetails, 
            scheduleDetails: {},
            action: 'send-now' 
          }),
        });

        if (res.ok) {
          sendResults.push({ 
            index: i + 1, 
            status: 'success', 
            message: `Message ${i + 1} sent successfully!` 
          });
        } else {
          const error = await res.json();
          sendResults.push({ 
            index: i + 1, 
            status: 'error', 
            message: error.message || 'Failed to send' 
          });
        }
        
        // Delay between messages to avoid conflicts
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error: any) {
        sendResults.push({ 
          index: i + 1, 
          status: 'error', 
          message: error.message 
        });
      }
      
      setResults([...sendResults]);
    }
    
    setSending(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📤 Kirim Banyak Pesan Sekaligus</h1>
        <p className="text-gray-600">Tambahkan beberapa pesan dan kirim semuanya dengan sekali klik</p>
      </div>

      {/* Messages List */}
      <div className="space-y-4 mb-6">
        {messages.map((msg, index) => (
          <div key={msg.id} className="app-card p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pesan #{index + 1}</h3>
              {messages.length > 1 && (
                <button
                  onClick={() => removeMessage(msg.id)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ✕ Hapus
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {/* Media Type */}
              <div>
                <label className="block font-semibold mb-2">Jenis Media</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      value="IMAGE" 
                      checked={msg.mediaType === 'IMAGE'} 
                      onChange={() => updateMessage(msg.id, 'mediaType', 'IMAGE')}
                      className="mr-2"
                    />
                    🖼️ Gambar
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      value="VIDEO" 
                      checked={msg.mediaType === 'VIDEO'} 
                      onChange={() => updateMessage(msg.id, 'mediaType', 'VIDEO')}
                      className="mr-2"
                    />
                    🎬 Video
                  </label>
                </div>
              </div>

              {/* Upload/URL */}
              <div>
                <label className="block font-semibold mb-2">Media</label>
                
                <div className="mb-3">
                  <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                    📁 Upload File
                    <input 
                      type="file" 
                      accept="image/*,video/*"
                      onChange={(e) => handleFileUpload(msg.id, e)}
                      className="hidden"
                    />
                  </label>
                  <span className="ml-3 text-sm text-gray-500">atau paste (Ctrl+V)</span>
                </div>

                <input 
                  type="url" 
                  value={msg.mediaUrl} 
                  onChange={(e) => updateMessage(msg.id, 'mediaUrl', e.target.value)}
                  onPaste={(e) => handlePaste(msg.id, e)}
                  placeholder="https://picsum.photos/800/600" 
                  className="app-input"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block font-semibold mb-2">Caption</label>
                <textarea 
                  value={msg.caption} 
                  onChange={(e) => updateMessage(msg.id, 'caption', e.target.value)}
                  rows={3} 
                  className="app-input" 
                  placeholder="Tulis caption untuk pesan ini..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={addMessage}
          className="btn-secondary"
          disabled={sending}
        >
          ➕ Tambah Pesan Baru
        </button>
        
        <button
          onClick={sendAllMessages}
          className="btn-primary flex-1"
          disabled={sending || messages.some(m => !m.mediaUrl || !m.caption)}
        >
          {sending ? '⏳ Mengirim...' : `📤 Kirim Semua (${messages.length} pesan)`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="app-card p-6 shadow-md">
          <h3 className="text-xl font-bold mb-4">📊 Hasil Pengiriman</h3>
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded ${result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                <span className="font-semibold">Pesan #{result.index}:</span> {result.message}
              </div>
            ))}
          </div>
          
          {!sending && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="font-semibold">
                ✅ Selesai! {results.filter(r => r.status === 'success').length}/{results.length} pesan berhasil dikirim
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h4 className="font-semibold mb-2">💡 Tips:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Setiap pesan akan dikirim dengan jeda 3 detik untuk menghindari konflik</li>
          <li>Pastikan semua pesan memiliki media URL dan caption</li>
          <li>Gunakan tombol "Upload File" atau paste gambar langsung (Ctrl+V)</li>
          <li>Video akan otomatis terdeteksi saat upload</li>
        </ul>
      </div>
    </div>
  );
}
