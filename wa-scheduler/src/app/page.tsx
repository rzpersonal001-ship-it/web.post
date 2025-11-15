'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalContent: number;
  activeSchedules: number;
  postsToday: number;
}

interface UpcomingJob {
  id: string;
  scheduledAt: string;
  post: {
    caption: string;
    category: {
      name: string;
    } | null;
  };
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/overview');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        setStats(data.stats);
        setUpcomingJobs(data.upcomingJobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="app-card p-6 shadow">
          <h2 className="text-lg font-semibold text-muted">Total Konten di Library</h2>
          <p className="text-3xl font-bold">{stats?.totalContent ?? 'N/A'}</p>
        </div>
        <div className="app-card p-6 shadow">
          <h2 className="text-lg font-semibold text-muted">Jadwal Aktif</h2>
          <p className="text-3xl font-bold">{stats?.activeSchedules ?? 'N/A'}</p>
        </div>
        <div className="app-card p-6 shadow">
          <h2 className="text-lg font-semibold text-muted">Kiriman Hari Ini</h2>
          <p className="text-3xl font-bold">{stats?.postsToday ?? 'N/A'}</p>
        </div>
      </div>


      {/* Upcoming Posts */}
      <div className="app-card p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Upcoming Posts</h2>
        <table className="app-table">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Tanggal & Jam</th>
              <th className="text-left p-2">Kategori</th>
              <th className="text-left p-2">Caption</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {upcomingJobs.map((job) => (
              <tr key={job.id} className="app-row-hover">
                <td className="p-2">{new Date(job.scheduledAt).toLocaleString()}</td>
                <td className="p-2">{job.post.category?.name ?? 'N/A'}</td>
                <td className="p-2 truncate max-w-sm">{job.post.caption}</td>
                <td className="p-2">
                  <span className="badge-status">
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
