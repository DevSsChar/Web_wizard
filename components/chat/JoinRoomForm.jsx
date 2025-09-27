"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Hash } from 'lucide-react';
import { useChat } from './ChatProvider';

export default function JoinRoomForm({ onJoined }) {
  const { joinRoom } = useChat();
  const [roomId, setRoomId] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinMode, setJoinMode] = useState('roomId'); // 'roomId' or 'inviteLink'

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalRoomId = roomId;
      
      // Extract room ID from invite link if provided
      if (joinMode === 'inviteLink' && inviteLink) {
        const linkMatch = inviteLink.match(/\/join\/(\d{6})/);
        if (linkMatch) {
          finalRoomId = linkMatch[1];
        } else {
          throw new Error('Invalid invite link format');
        }
      }
      
      if (!finalRoomId || finalRoomId.length !== 6) {
        throw new Error('Room ID must be 6 digits');
      }
      
      const res = await fetch('/api/chatrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: finalRoomId, 
          password: password || undefined,
          inviteLink: joinMode === 'inviteLink' ? inviteLink : undefined
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      
      // Join the room via socket
      await joinRoom(finalRoomId);
      onJoined?.(json.room);
      setRoomId('');
      setInviteLink('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <LogIn className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-white">Join Room</h3>
      </div>
      
      <form onSubmit={submit} className="space-y-4">
        {/* Join Mode Toggle */}
        <div className="flex space-x-2 p-1 bg-gray-800/50 rounded-lg">
          <button
            type="button"
            onClick={() => setJoinMode('roomId')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
              joinMode === 'roomId'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Room ID
          </button>
          <button
            type="button"
            onClick={() => setJoinMode('inviteLink')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
              joinMode === 'inviteLink'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Invite Link
          </button>
        </div>
        
        {/* Input Fields */}
        {joinMode === 'roomId' ? (
          <div>
            <Input
              placeholder="Room ID (6 digits)"
              value={roomId}
              onChange={e => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 6))}
              pattern="[0-9]{6}"
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        ) : (
          <div>
            <Input
              placeholder="Invite link (e.g., https://yourapp.com/join/123456)"
              value={inviteLink}
              onChange={e => setInviteLink(e.target.value)}
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        )}
        
        <div>
          <Input
            placeholder="Password (if required)"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <Button
          disabled={loading || (joinMode === 'roomId' ? roomId.length !== 6 : !inviteLink.trim())}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700"
        >
          {loading ? 'Joining...' : 'Join Room'}
        </Button>
      </form>
    </div>
  );
}
