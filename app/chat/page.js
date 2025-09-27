"use client";
import { useEffect, useState } from 'react';
import ChatDashboard from '@/components/chat/ChatDashboard';

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');
        if (json.user && !json.user.isProfileCompleted) {
          setProfileIncomplete(true);
        }
        if (mounted) {
          setToken(json.token);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; }
  }, []);

  if (loading) return <div className="p-6 text-sm">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (profileIncomplete) return <div className="p-6 text-sm text-yellow-600">Please complete your profile before using chat.</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Chat Playground</h2>
      <ChatDashboard token={token} />
    </div>
  );
}
