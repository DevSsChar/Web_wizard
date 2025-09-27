"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useToast } from '../ui/toast';

const ChatContext = createContext(null);

export function ChatProvider({ token, children }) {
  const toast = useToast();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState({}); // roomId -> { messages, participants }
  const [joinedRooms, setJoinedRooms] = useState({}); // Persistent joined rooms
  const [publicRooms, setPublicRooms] = useState([]); // Available public rooms
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [user, setUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // roomId -> [usernames]
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Load persisted data on mount
  useEffect(() => {
    const savedRooms = localStorage.getItem('chat-joined-rooms');
    const savedActiveRoom = localStorage.getItem('chat-active-room');
    if (savedRooms) {
      try {
        setJoinedRooms(JSON.parse(savedRooms));
      } catch (e) {
        console.error('Failed to parse saved rooms:', e);
      }
    }
    if (savedActiveRoom) {
      setActiveRoom(savedActiveRoom);
    }
  }, []);

  // Connect socket when token present
  useEffect(() => {
    if (!token) return;
    
    // Load user info
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
    
    const socket = io((process.env.NEXT_PUBLIC_BACKEND_WS?.replace('ws','http')) || 'http://localhost:4000', {
      autoConnect: false,
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      setSocketError(null);
      
      // Load all rooms first
      loadRooms();
      
      // Rejoin all previously joined rooms
      Object.keys(joinedRooms).forEach(roomId => {
        socket.emit('joinRoom', { roomId });
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setSocketError(reason);
      }
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setSocketError(err.message || 'Connection failed');
    });

    socket.on('history', (payload) => {
      console.log('Received history:', payload);
      const { roomId, messages } = Array.isArray(payload) ? { roomId: activeRoom, messages: payload } : payload;
      if (roomId) {
        setRooms(prev => ({
          ...prev,
          [roomId]: {
            ...(prev[roomId] || {}),
            messages: messages || []
          }
        }));
      }
    });

    socket.on('message', (msg) => {
      console.log('Received message:', msg);
      const roomId = msg.roomId || msg.room || activeRoom;
      if (roomId) {
        setRooms(prev => {
          const currentMessages = prev[roomId]?.messages || [];
          // Prevent duplicate messages
          const messageExists = currentMessages.some(m => m.id === msg.id);
          if (messageExists) return prev;
          
          return {
            ...prev,
            [roomId]: {
              ...(prev[roomId] || {}),
              messages: [...currentMessages, msg]
            }
          };
        });
        
        // Show toast notification if message is not from current user
        if (msg.sender?.username !== user?.username) {
          toast.info(`${msg.sender?.username || 'Someone'}: ${msg.text}`, 3000);
        }
      }
    });
    
    // Typing indicators
    socket.on('userTyping', ({ roomId, username, isTyping: typing }) => {
      console.log('User typing:', { roomId, username, typing });
      setTypingUsers(prev => {
        const roomTyping = prev[roomId] || [];
        if (typing) {
          if (!roomTyping.includes(username)) {
            return {
              ...prev,
              [roomId]: [...roomTyping, username]
            };
          }
        } else {
          return {
            ...prev,
            [roomId]: roomTyping.filter(u => u !== username)
          };
        }
        return prev;
      });
    });
    
    // System messages for join/leave
    socket.on('system', (data) => {
      console.log('System message:', data);
      const { roomId, message, type } = data;
      if (roomId) {
        const systemMsg = {
          id: Date.now() + Math.random(),
          roomId,
          type: 'system',
          text: message,
          createdAt: new Date().toISOString(),
          sender: { username: 'System', name: 'System' }
        };
        
        setRooms(prev => {
          const currentMessages = prev[roomId]?.messages || [];
          return {
            ...prev,
            [roomId]: {
              ...(prev[roomId] || {}),
              messages: [...currentMessages, systemMsg]
            }
          };
        });
        
        // Show toast notification for join/leave
        if (type === 'join') {
          toast.success(message, 3000);
        } else if (type === 'leave') {
          toast.warning(message, 3000);
        } else {
          toast.info(message, 3000);
        }
      }
    });

    socket.on('messageEdited', (msg) => {
      console.log('Message edited:', msg);
      const roomId = msg.room || msg.roomId;
      if (roomId) {
        setRooms(prev => ({
          ...prev,
          [roomId]: {
            ...(prev[roomId] || {}),
            messages: (prev[roomId]?.messages || []).map(m => m.id === msg.id ? msg : m)
          }
        }));
      }
    });
    
    socket.on('roomJoined', (roomData) => {
      console.log('Room joined:', roomData);
      if (roomData.room) {
        const newJoinedRooms = { ...joinedRooms, [roomData.room.roomId]: roomData.room };
        setJoinedRooms(newJoinedRooms);
        localStorage.setItem('chat-joined-rooms', JSON.stringify(newJoinedRooms));
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setSocketError(error.message || 'An error occurred');
    });

    return () => {
      socket.disconnect();
    }
  }, [token, activeRoom]);

  // Load rooms (both joined and public)
  const loadRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/chatrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded rooms:', data);
        
        // Set joined rooms
        if (data.joinedRooms) {
          const joinedRoomsMap = {};
          data.joinedRooms.forEach(room => {
            joinedRoomsMap[room.roomId] = room;
          });
          setJoinedRooms(joinedRoomsMap);
          localStorage.setItem('chat-joined-rooms', JSON.stringify(joinedRoomsMap));
        }
        
        // Set public rooms
        setPublicRooms(data.publicRooms || []);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }, [token]);
  
  // Load public rooms only
  const loadPublicRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPublicRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Failed to load public rooms:', error);
    }
  }, [token]);

  const joinRoom = useCallback(async (roomId) => {
    if (!socketRef.current) return;
    if (socketRef.current.disconnected) {
      socketRef.current.connect();
    }
    
    console.log('Joining room:', roomId);
    setActiveRoom(roomId);
    localStorage.setItem('chat-active-room', roomId);
    
    // Initialize room in state if not exists
    setRooms(prev => ({
      ...prev,
      [roomId]: prev[roomId] || { messages: [] }
    }));
    
    // Join via socket
    socketRef.current.emit('joinRoom', { roomId });
    
    // Load message history from API if room is not in state
    if (!rooms[roomId]?.messages?.length) {
      try {
        const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded messages from API:', data.messages);
          setRooms(prev => ({
            ...prev,
            [roomId]: {
              ...(prev[roomId] || {}),
              messages: data.messages || []
            }
          }));
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    }
  }, [token, rooms]);

  const leaveRoom = useCallback((roomId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leaveRoom', { roomId });
    
    const newJoinedRooms = { ...joinedRooms };
    delete newJoinedRooms[roomId];
    setJoinedRooms(newJoinedRooms);
    localStorage.setItem('chat-joined-rooms', JSON.stringify(newJoinedRooms));
    
    if (activeRoom === roomId) {
      setActiveRoom(null);
      localStorage.removeItem('chat-active-room');
    }
  }, [joinedRooms, activeRoom]);

  const sendMessage = useCallback((roomId, { text }) => {
    if (!socketRef.current || !connected) {
      console.log('Cannot send message: socket not connected');
      return;
    }
    
    console.log('Sending message:', { roomId, text });
    socketRef.current.emit('newMessage', { roomId, type: 'text', text });
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socketRef.current.emit('typing', { roomId, isTyping: false });
    }
  }, [connected, isTyping]);
  
  const startTyping = useCallback((roomId) => {
    if (!socketRef.current || !connected || isTyping) return;
    
    setIsTyping(true);
    socketRef.current.emit('typing', { roomId, isTyping: true });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current && connected) {
        socketRef.current.emit('typing', { roomId, isTyping: false });
      }
    }, 3000);
  }, [connected, isTyping]);
  
  const stopTyping = useCallback((roomId) => {
    if (!socketRef.current || !connected || !isTyping) return;
    
    setIsTyping(false);
    socketRef.current.emit('typing', { roomId, isTyping: false });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [connected, isTyping]);
  
  const createRoom = useCallback(async (roomData) => {
    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomData)
      });
      
      if (response.ok) {
        const data = await response.json();
        const room = data.room;
        
        // Add to joined rooms
        const newJoinedRooms = { ...joinedRooms, [room.roomId]: room };
        setJoinedRooms(newJoinedRooms);
        localStorage.setItem('chat-joined-rooms', JSON.stringify(newJoinedRooms));
        
        // Join the room
        joinRoom(room.roomId);
        
        return room;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }, [token, joinedRooms, joinRoom]);
  
  // Load initial rooms when token is available
  useEffect(() => {
    if (token) {
      loadRooms();
    }
  }, [token, loadRooms]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    connected,
    rooms,
    joinedRooms,
    publicRooms,
    activeRoom,
    user,
    socketError,
    typingUsers,
    isTyping,
    joinRoom,
    leaveRoom,
    sendMessage,
    createRoom,
    loadPublicRooms,
    loadRooms,
    startTyping,
    stopTyping,
    loading
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
