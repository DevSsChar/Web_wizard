"use client";
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from './ChatProvider';
import { Send, Users, Hash } from 'lucide-react';

export default function ChatWindow({ room }) {
  const { rooms, sendMessage, activeRoom, connected, typingUsers, startTyping, stopTyping } = useChat();
  const [text, setText] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const messages = rooms[activeRoom]?.messages || [];
  const typingInRoom = typingUsers[activeRoom] || [];
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]);
  
  // Load participants when room changes
  useEffect(() => {
    if (activeRoom) {
      loadParticipants();
    }
  }, [activeRoom]);
  
  const loadParticipants = async () => {
    if (!activeRoom) return;
    try {
      const response = await fetch(`/api/chatrooms/${activeRoom}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  if (!room) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <div className="text-gray-300 text-lg font-medium">Select a chat room</div>
          <div className="text-gray-500 text-sm">Choose a room to start messaging</div>
        </div>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || !connected) return;
    sendMessage(activeRoom, { text });
    setText('');
    inputRef.current?.focus();
  };
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);
    
    if (value.trim() && connected && activeRoom) {
      startTyping(activeRoom);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{room.name}</h3>
              <p className="text-gray-400 text-sm flex items-center space-x-2">
                <span>#{room.roomId}</span>
                {room.isPrivate && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Private</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-gray-800/50"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">{participants.length}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Chat and Participants */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-500" />
            </div>
            <div className="text-gray-400 text-sm">No messages yet</div>
            <div className="text-gray-600 text-xs">Be the first to start the conversation!</div>
          </div>
        ) : (
          messages.map((m, index) => {
            const isFirstOfGroup = index === 0 || messages[index - 1]?.sender?.username !== m.sender?.username;
            const showAvatar = isFirstOfGroup;
            const isSystemMessage = m.type === 'system';
            
            if (isSystemMessage) {
              return (
                <div key={m.id || index} className="flex justify-center my-2">
                  <div className="bg-gray-800/50 text-gray-400 text-xs px-3 py-1 rounded-full">
                    {m.text}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={m.id || index} className={`flex space-x-3 ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                {showAvatar ? (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {(m.sender?.username || m.sender?.name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0"></div>
                )}
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-white font-medium text-sm">
                        {m.sender?.username || m.sender?.name || 'Unknown User'}
                      </span>
                      <span className="text-gray-500 text-xs">{formatTime(m.createdAt)}</span>
                      {m.isEdited && <span className="text-gray-500 text-xs italic">(edited)</span>}
                    </div>
                  )}
                  {m.text && (
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words bg-gray-800/30 rounded-lg px-3 py-2 max-w-2xl">
                      {m.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicators */}
        {typingInRoom.length > 0 && (
          <div className="flex space-x-3 mt-2">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex items-center">
              <div className="text-gray-400 text-sm italic">
                {typingInRoom.length === 1 
                  ? `${typingInRoom[0]} is typing...`
                  : `${typingInRoom.slice(0, -1).join(', ')} and ${typingInRoom.slice(-1)} are typing...`
                }
              </div>
            </div>
          </div>
        )}
        
          <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/70 flex-shrink-0">
            <form onSubmit={submit} className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={text}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={connected ? "Type a message..." : "Connecting..."}
                  disabled={!connected}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  maxLength={1000}
                />
              </div>
              <Button
                type="submit"
                disabled={!text.trim() || !connected}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
        
        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-64 border-l border-gray-800 bg-gray-900/70 flex-shrink-0">
            <div className="p-4">
              <h4 className="text-white font-semibold text-sm mb-3 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Participants ({participants.length})</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {participants.map((participant, index) => (
                  <div key={participant._id || index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-xs">
                        {(participant.name || participant.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {participant.name || participant.username || 'Unknown User'}
                      </div>
                      <div className="text-gray-400 text-xs truncate">
                        {participant.email}
                      </div>
                    </div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
                    No participants loaded
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
