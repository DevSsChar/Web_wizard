"use client";
import { useEffect, useState } from 'react';
import { ChatProvider, useChat } from './ChatProvider';
import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import { Button } from '@/components/ui/button';

function InnerChatDashboard({ token }) {
  const { joinRoom, activeRoom, rooms } = useChat();
  const [joinedRooms, setJoinedRooms] = useState({});
  const [error, setError] = useState(null);

  const handleCreated = (room) => {
    setJoinedRooms(prev => ({ ...prev, [room.roomId]: room }));
    joinRoom(room.roomId);
  }
  const handleJoined = (room) => {
    setJoinedRooms(prev => ({ ...prev, [room.roomId]: room }));
    joinRoom(room.roomId);
  }

  const currentRoom = activeRoom ? joinedRooms[activeRoom] : null;

  return (
    <div className="grid md:grid-cols-4 gap-4 h-[70vh]">
      <div className="space-y-4 md:col-span-1 flex flex-col">
        <CreateRoomForm onCreated={handleCreated} token={token} />
        <JoinRoomForm onJoined={handleJoined} />
        <RoomList rooms={joinedRooms} activeRoom={activeRoom} onSelect={joinRoom} />
      </div>
      <div className="md:col-span-3 h-full">
        <ChatWindow room={currentRoom} />
      </div>
    </div>
  );
}

export default function ChatDashboardWrapper({ token }) {
  if (!token) {
    return <div className="p-6 text-sm text-red-500">No token provided. Fetch /api/auth/me first.</div>
  }
  return (
    <ChatProvider token={token}>
      <InnerChatDashboard token={token} />
    </ChatProvider>
  );
}
