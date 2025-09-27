"use client";
import { useEffect, useState } from 'react';
import { ChatProvider, useChat } from './ChatProvider';
import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import UserPanel from './UserPanel';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi } from 'lucide-react';

function InnerChatDashboard({ token }) {
  const { joinRoom, activeRoom, joinedRooms, connected, socketError } = useChat();
  const [error, setError] = useState(null);
  const [showUserPanel, setShowUserPanel] = useState(false);

  const handleCreated = (room) => {
    // Room is already added to joinedRooms in ChatProvider
    console.log('Room created:', room);
  };
  
  const handleJoined = (room) => {
    // Room is already added to joinedRooms in ChatProvider
    console.log('Room joined:', room);
  };

  const currentRoom = activeRoom ? joinedRooms[activeRoom] : null;

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Connection Status */}
      {socketError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 flex-shrink-0">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">Connection error: {socketError}</span>
        </div>
      )}
      
      <div className="grid xl:grid-cols-12 lg:grid-cols-8 gap-6 flex-1 min-h-0">
        {/* Left Sidebar - Room Management */}
        <div className="xl:col-span-3 lg:col-span-3 flex flex-col min-h-0 space-y-4">
          <div className="flex-shrink-0 space-y-4">
            <CreateRoomForm onCreated={handleCreated} token={token} />
            <JoinRoomForm onJoined={handleJoined} />
          </div>
          <div className="flex-1 min-h-0">
            <RoomList rooms={joinedRooms} activeRoom={activeRoom} onSelect={joinRoom} />
          </div>
        </div>
        
        {/* Center - Chat Window */}
        <div className="xl:col-span-6 lg:col-span-5 min-h-0">
          <ChatWindow room={currentRoom} />
        </div>
        
        {/* Right Sidebar - User Panel */}
        <div className="xl:col-span-3 lg:col-span-0 lg:hidden xl:block min-h-0">
          <UserPanel room={currentRoom} />
        </div>
      </div>
    </div>
  );
}

export default function ChatDashboardWrapper({ token }) {
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-red-400 text-lg font-medium">Authentication Required</div>
          <div className="text-gray-500 text-sm">Please log in to access the chat</div>
        </div>
      </div>
    );
  }
  
  return (
    <ChatProvider token={token}>
      <InnerChatDashboard token={token} />
    </ChatProvider>
  );
}
