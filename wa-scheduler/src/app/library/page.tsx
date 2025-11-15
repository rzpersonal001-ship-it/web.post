'use client';

import { useState, useEffect } from 'react';

// Define types for better readability
interface Post {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string;
  category: { name: string } | null;
  createdAt: string;
}

export default function LibraryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for filters if needed, e.g., category, search term

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const res = await fetch('/api/posts'); // Add query params for filters
        if (!res.ok) throw new Error('Failed to fetch content library');
        const data = await res.json();
        setPosts(data.posts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleSendNow = async (postId: string) => {
    // This would typically be a separate API call, e.g., POST /api/posts/:id/send
    alert(`Sending post ${postId} now... (implementation needed)`);
  };

  const handleSchedule = (postId: string) => {
    // This would open a modal to set schedule details
    alert(`Scheduling post ${postId}... (implementation needed)`);
  };

  if (loading) return <div>Loading content library...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Library Konten</h1>

      {/* Add filter UI elements here */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="app-card shadow overflow-hidden">
            {post.mediaType === 'IMAGE' ? (
              <img src={post.mediaUrl} alt="Post media" className="w-full h-48 object-cover"/>
            ) : (
              <div className="w-full h-48 bg-[#020617] flex items-center justify-center text-muted">
                <span>Video Media</span>
              </div>
            )}
            <div className="p-4">
              <p className="text-sm text-muted">{post.category?.name || 'No Category'}</p>
              <p className="mt-2 text-gray-700 truncate">{post.caption}</p>
              <p className="text-xs text-gray-400 mt-1">
                Created: {new Date(post.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleSchedule(post.id)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded">
                  Schedule Ulang
                </button>
                <button onClick={() => handleSendNow(post.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded">
                  Kirim Sekarang
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
