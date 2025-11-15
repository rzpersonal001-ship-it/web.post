'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ScheduledJob {
  id: string;
  scheduledAt: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  post: {
    caption: string;
    category: { name: string } | null;
  };
  schedule: { name: string | null } | null;
}

export default function SchedulesPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState('upcoming'); // 'upcoming' or 'past'

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const now = new Date();
        const startDate = view === 'upcoming' ? now.toISOString() : undefined;
        const endDate = view === 'past' ? now.toISOString() : undefined;

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        // A simple way to get past jobs would be to fetch without a start date and sort desc

        const res = await fetch(`/api/scheduled-jobs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch scheduled jobs');
        let data = await res.json();

        // For past view, we'd ideally fetch descending and limit.
        // Here, we'll just filter and reverse client-side for simplicity.
        if (view === 'past') {
          data = data.filter((job: ScheduledJob) => new Date(job.scheduledAt) < now).reverse();
        }

        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [view]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Jadwal Otomatis</h1>

      {/* View toggle */}
      <div className="mb-4">
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setView('upcoming')}
            className={view === 'upcoming' ? 'btn-primary' : 'btn-secondary'}
          >
            Akan Datang
          </button>
          <button
            onClick={() => setView('past')}
            className={view === 'past' ? 'btn-primary' : 'btn-secondary'}
          >
            Riwayat
          </button>
        </div>
      </div>

      {loading && <div>Loading jobs...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!loading && !error && (
        <div className="app-card p-6 shadow">
          <table className="app-table">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Tanggal & Jam</th>
                <th className="text-left p-2">Schedule Name</th>
                <th className="text-left p-2">Konten</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="app-row-hover">
                  <td className="p-2">{format(new Date(job.scheduledAt), 'Pp')}</td>
                  <td className="p-2">{job.schedule?.name ?? 'One-off'}</td>
                  <td className="p-2 truncate max-w-xs">{job.post.caption}</td>
                  <td className="p-2">{job.status}</td>
                  <td className="p-2">{/* Action buttons like cancel, etc. */}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
