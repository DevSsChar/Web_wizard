"use client";
import { useState, useEffect } from 'react';
import { Users, Crown, Shield, User, ChevronRight, ChevronDown } from 'lucide-react';
import { useChat } from './ChatProvider';

export default function UserPanel({ room }) {
  const { user: currentUser } = useChat();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (room?.roomId) {
      loadParticipants(room.roomId);
    }
  }, [room?.roomId]);

  const loadParticipants = async (roomId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chatrooms/${roomId}/participants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('chat-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      // Fallback to mock data for demo
      setParticipants([
        {
          _id: '1',
          name: currentUser?.name || 'You',
          username: currentUser?.username || 'you',
          isOnline: true,
          role: 'admin',
          joinedAt: new Date()
        },
        {
          _id: '2',
          name: 'John Doe',
          username: 'johndoe',
          isOnline: true,
          role: 'member',
          joinedAt: new Date(Date.now() - 3600000)
        },
        {
          _id: '3',
          name: 'Jane Smith',
          username: 'janesmith',
          isOnline: false,
          role: 'member',
          joinedAt: new Date(Date.now() - 7200000)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatJoinTime = (date) => {
    const now = new Date();
    const joinTime = new Date(date);
    const diffInHours = Math.floor((now - joinTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just joined';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return joinTime.toLocaleDateString();
  };

  if (!room) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4 h-full">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-500" />
          </div>
          <div className="text-gray-400 text-sm">Select a room to see participants</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Participants</h3>
              <p className="text-gray-400 text-xs">{participants.length} members</p>
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Participants List */}
      {expanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400 text-sm">No participants found</p>
            </div>
          ) : (
            participants.map(participant => (
              <div key={participant._id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-200">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {participant.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                    participant.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium text-sm truncate">
                      {participant.name}
                      {participant._id === currentUser?.id && (
                        <span className="text-blue-400 ml-1">(You)</span>
                      )}
                    </span>
                    {getRoleIcon(participant.role)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>@{participant.username}</span>
                    <span>•</span>
                    <span>{formatJoinTime(participant.joinedAt)}</span>
                  </div>
                </div>
                
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  participant.isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}