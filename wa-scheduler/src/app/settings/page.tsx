'use client';

import { useState, useEffect } from 'react';

interface WhatsAppConfig {
  phoneNumberId: string;
  destinationType: 'SINGLE' | 'GROUP';
  destinationIdentifier: string;
  timezone: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumberId: '',
    destinationType: 'GROUP',
    destinationIdentifier: '',
    timezone: 'Asia/Pontianak',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      const res = await fetch('/api/whatsapp-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/whatsapp-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      alert('Settings saved successfully!');
    } else {
      alert('Failed to save settings.');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await fetch('/api/whatsapp-test', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
    setTesting(false);
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pengaturan</h1>
      <div className="app-card p-8 shadow max-w-2xl">

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="phoneNumberId" className="block font-semibold">Phone Number ID</label>
            <input
              id="phoneNumberId"
              type="text"
              value={config.phoneNumberId}
              onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
              className="app-input"
            />
            <p className="text-sm text-gray-500 mt-1">From your Meta for Developers app.</p>
          </div>

          <div>
            <label className="block font-semibold">Destination Type</label>
            <select
              value={config.destinationType}
              onChange={(e) => setConfig({ ...config, destinationType: e.target.value as 'SINGLE' | 'GROUP' })}
              className="app-input"
            >
              <option value="GROUP">Group</option>
              <option value="SINGLE">Single Number</option>
            </select>
          </div>

          <div>
            <label htmlFor="destinationIdentifier" className="block font-semibold">Destination Identifier</label>
            <input
              id="destinationIdentifier"
              type="text"
              value={config.destinationIdentifier}
              onChange={(e) => setConfig({ ...config, destinationIdentifier: e.target.value })}
              className="app-input"
            />
            <p className="text-sm text-muted mt-1">Your WhatsApp Group ID or a phone number.</p>

          </div>

          <div>
            <p className="block font-semibold">Access Token</p>
            <p className="text-gray-700 bg-gray-100 p-2 rounded">
              Access token is configured via the `WHATSAPP_ACCESS_TOKEN` environment variable and is not displayed here for security.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

        </form>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Test Configuration</h2>
          <button onClick={handleTest} disabled={testing} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300">
            {testing ? 'Sending...' : 'Tes Kirim Pesan'}
          </button>
        </div>
      </div>
    </div>
  );
}
