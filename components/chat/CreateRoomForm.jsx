"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Lock, Eye } from 'lucide-react';
import { useChat } from './ChatProvider';

export default function CreateRoomForm({ onCreated, token }) {
  const { createRoom } = useChat();
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
      const room = await createRoom({
        name,
        password: password || undefined,
        isPrivate
      });
      onCreated?.(room);
      setName('');
      setPassword('');
      setIsPrivate(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-white">Create Room</h3>
      </div>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Input
            placeholder="Room name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
          />
        </div>
        
        <div>
          <Input
            placeholder="Password (optional)"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              isPrivate
                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {isPrivate ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{isPrivate ? 'Private' : 'Public'}</span>
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <Button
          disabled={loading || !name}
          type="submit"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700"
        >
          {loading ? 'Creating...' : 'Create Room'}
        </Button>
      </form>
    </div>
  );
}
