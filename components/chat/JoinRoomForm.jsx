"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Hash } from 'lucide-react';
import { useChat } from './ChatProvider';

export default function JoinRoomForm({ onJoined }) {
  const { joinRoom } = useChat();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  // Check room info when room ID changes
  const checkRoomInfo = async (id) => {
    if (id.length !== 6) {
      setRoomInfo(null);
      return;
    }
    
    setCheckingRoom(true);
    try {
      const res = await fetch(`/api/chatrooms/${id}/info`);
      if (res.ok) {
        const data = await res.json();
        setRoomInfo(data.room);
      } else {
        setRoomInfo(null);
        setError('Room not found');
      }
    } catch (err) {
      setRoomInfo(null);
    } finally {
      setCheckingRoom(false);
    }
  };
  
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
      
      // Join the room via socket
      await joinRoom(roomId);
      onJoined?.(json.room);
      setRoomId('');
      setPassword('');
      setRoomInfo(null);
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
        <div>
          <Input
            placeholder="Room ID (6 digits)"
            value={roomId}
            onChange={e => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setRoomId(value);
              setError(null);
              if (value.length === 6) {
                checkRoomInfo(value);
              }
            }}
            pattern="[0-9]{6}"
            required
            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
          {checkingRoom && (
            <div className="text-gray-400 text-xs mt-1">Checking room...</div>
          )}
          {roomInfo && (
            <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700">
              <div className="text-white text-sm font-medium">{roomInfo.name}</div>
              <div className="text-gray-400 text-xs flex items-center space-x-2">
                {roomInfo.isPrivate ? (
                  <><Lock className="w-3 h-3" /> <span>Private Room</span></>
                ) : (
                  <><Hash className="w-3 h-3" /> <span>Public Room</span></>
                )}
              </div>
            </div>
          )}
        </div>
        
        {roomInfo?.isPrivate && (
          <div>
            <Input
              placeholder="Password (required for private room)"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <Button
          disabled={loading || roomId.length !== 6 || (roomInfo?.isPrivate && !password.trim())}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700"
        >
          {loading ? 'Joining...' : roomInfo ? `Join ${roomInfo.name}` : 'Join Room'}
        </Button>
      </form>
    </div>
  );
}
