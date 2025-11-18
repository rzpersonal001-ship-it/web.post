import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WA Content Scheduler',
  description: 'Manage and schedule content for WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html lang="en">
    <body className="font-sans">
      <div className="flex min-h-screen app-shell">
          <aside className="w-64 app-sidebar shadow-md">
            <div className="p-6 app-sidebar-header">
              <h1 className="text-2xl font-bold">WA Scheduler</h1>
            </div>
            <nav>
              <ul>
                <li className="p-4 app-nav-item">
                  <a href="/">Dashboard</a>
                </li>
                <li className="p-4 app-nav-item">
                  <a href="/new-post">Posting Baru</a>
                </li>
                <li className="p-4 app-nav-item">
                  <a href="/bulk-send">📤 Kirim Banyak</a>
                </li>
                <li className="p-4 app-nav-item">
                  <a href="/saved-messages">💾 Pesan Tersimpan</a>
                </li>
                <li className="p-4 app-nav-item">
                  <a href="/library">Library Konten</a>
                </li>
                <li className="p-4 app-nav-item">
                  <a href="/schedules">Jadwal Otomatis</a>
                </li>
                <li className="p-4 app-nav-item">
                  <a href="/settings">Pengaturan</a>
                </li>
              </ul>
            </nav>
          </aside>

          <main className="flex-1 p-8 app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
