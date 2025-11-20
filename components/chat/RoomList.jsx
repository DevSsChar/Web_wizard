"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash, Lock, Globe, X, Users } from 'lucide-react';
import { useChat } from './ChatProvider';

export default function RoomList({ rooms, onSelect, activeRoom }) {
  const { publicRooms, loadPublicRooms, loadRooms, joinRoom, leaveRoom, user } = useChat();
  const [filter, setFilter] = useState('');
  const [showPublic, setShowPublic] = useState(true);
  const [roomParticipants, setRoomParticipants] = useState({});
  
  const joinedRoomsList = Object.values(rooms || {}).filter(r => 
    !filter || r.name?.toLowerCase().includes(filter.toLowerCase()) || r.roomId?.includes(filter)
  );
  
  const publicRoomsList = publicRooms.filter(r => 
    !rooms[r.roomId] && (!filter || r.name?.toLowerCase().includes(filter.toLowerCase()) || r.roomId?.includes(filter))
  );

  useEffect(() => {
    if (showPublic) {
      loadRooms();
    }
  }, [showPublic, loadRooms]);

  const handleJoinPublicRoom = async (roomId) => {
    try {
      await joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };
  
  // Load room participants
  const loadRoomParticipants = async (roomId) => {
    try {
      const response = await fetch(`/api/chatrooms/${roomId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setRoomParticipants(prev => ({
          ...prev,
          [roomId]: data.participants || []
        }));
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };
  
  // Load participants for active room
  useEffect(() => {
    if (activeRoom) {
      loadRoomParticipants(activeRoom);
    }
  }, [activeRoom]);

  return (
    <div className="space-y-4">
      {/* Joined Rooms */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Your Rooms</span>
          </h3>
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
            {joinedRoomsList.length}
          </span>
        </div>
        
        <Input
          className="mb-3 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-sm"
          placeholder="Filter rooms..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" style={{ minHeight: 0 }}>
          {joinedRoomsList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No rooms joined yet</p>
              <p className="text-xs">Create or join a room to start chatting</p>
            </div>
          )}
          
          {joinedRoomsList.map(r => (
            <div
              key={r.roomId}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activeRoom === r.roomId
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                  : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
              }`}
              onClick={() => onSelect(r.roomId)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activeRoom === r.roomId ? 'bg-blue-500' : 'bg-gray-700'
                }`}>
                  {r.isPrivate ? (
                    <Lock className="w-4 h-4 text-white" />
                  ) : (
                    <Hash className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">{r.name}</div>
                  <div className="text-gray-400 text-xs flex items-center space-x-2">
                    <span>#{r.roomId}</span>
                    <span>•</span>
                    <span>{roomParticipants[r.roomId]?.length || r.participants?.length || 0} users</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {r.isPrivate && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                    Private
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to leave "${r.name}"?`)) {
                      leaveRoom(r.roomId);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md transition-all duration-200 text-red-400 hover:text-red-300"
                  title={`Leave ${r.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public Rooms */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Public Rooms</span>
          </h3>
          <Button
            onClick={() => setShowPublic(!showPublic)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            {showPublic ? 'Hide' : 'Show'}
          </Button>
        </div>
        
        {showPublic && (
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {publicRoomsList.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Globe className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No public rooms available</p>
              </div>
            )}
            
            {publicRoomsList.map(r => (
              <div
                key={r.roomId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 border border-transparent hover:border-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{r.name}</div>
                    <div className="text-gray-400 text-xs">#{r.roomId}</div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleJoinPublicRoom(r.roomId)}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
