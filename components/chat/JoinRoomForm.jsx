"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JoinRoomForm({ onJoined }) {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chatrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password: password || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      onJoined?.(json.room);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-md border bg-background/60 backdrop-blur">
      <h3 className="font-semibold text-sm">Join Chat Room</h3>
      <Input placeholder="Room ID (6 digits)" value={roomId} onChange={e=>setRoomId(e.target.value)} pattern="[0-9]{6}" required />
      <Input placeholder="Password (if any)" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button disabled={loading || roomId.length!==6} size="sm" type="submit" className="w-full">{loading ? 'Joining...' : 'Join'}</Button>
    </form>
  );
}
