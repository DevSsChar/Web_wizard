"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const ChatContext = createContext(null);

export function ChatProvider({ token, children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState({}); // roomId -> { messages, participants }
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketError, setSocketError] = useState(null);

  // Connect socket when token present
  useEffect(() => {
    if (!token) return;
    const socket = io((process.env.NEXT_PUBLIC_BACKEND_WS?.replace('ws','http')) || 'http://localhost:4000', {
      autoConnect: false,
      // Allow engine.io to negotiate (websocket or polling) instead of forcing websocket only
      auth: { token }
    });
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setSocketError(reason);
      }
    });
    socket.on('connect_error', (err) => {
      setSocketError(err.message || 'connect_error');
      // try a delayed reconnect (basic backoff)
      setTimeout(()=>{
        if (socket.disconnected) socket.connect();
      }, 1500);
    });

    socket.on('history', (payload) => {
      const { roomId, messages } = Array.isArray(payload) ? { roomId: activeRoom, messages: payload } : payload;
      setRooms(prev => ({
        ...prev,
        [roomId]: {
          ...(prev[roomId] || {}),
          messages
        }
      }));
    });

    socket.on('message', (msg) => {
      const key = msg.roomId || activeRoom;
      setRooms(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || { messages: [] }),
          messages: [ ...(prev[key]?.messages || []), msg ]
        }
      }));
    });

    socket.on('messageEdited', (msg) => {
      setRooms(prev => ({
        ...prev,
        [msg.room]: {
          ...(prev[msg.room] || {}),
          messages: (prev[msg.room]?.messages || []).map(m => m.id === msg.id ? msg : m)
        }
      }));
    });

    return () => {
      socket.disconnect();
    }
  }, [token, activeRoom]);

  const joinRoom = useCallback(async (roomId) => {
    if (!socketRef.current) return;
    if (socketRef.current.disconnected) {
      socketRef.current.connect();
    }
    setActiveRoom(roomId);
    socketRef.current.emit('joinRoom', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leaveRoom', { roomId });
    setActiveRoom(null);
  }, []);

  const sendMessage = useCallback((roomId, { text }) => {
    if (!socketRef.current) return;
    socketRef.current.emit('newMessage', { roomId, type: 'text', text });
  }, []);

  const value = {
    connected,
    rooms,
    activeRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    loading
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
