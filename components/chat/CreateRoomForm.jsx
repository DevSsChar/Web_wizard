"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CreateRoomForm({ onCreated, token }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, password: password || undefined, isPrivate })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      onCreated?.(json.room);
      setName(''); setPassword(''); setIsPrivate(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-md border bg-background/60 backdrop-blur">
      <h3 className="font-semibold text-sm">Create Chat Room</h3>
      <Input placeholder="Room name" value={name} onChange={e=>setName(e.target.value)} required />
      <Input placeholder="Password (optional)" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} /> Private
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button disabled={loading || !name} size="sm" type="submit" className="w-full">{loading ? 'Creating...' : 'Create'}</Button>
    </form>
  );
}
