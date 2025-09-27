import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.js';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import connectDB from '../db/connectDB.mjs';

let io;

export const initializeSocket = (server) => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      await connectDB();
      
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);

    // Join user to their rooms
    socket.on('join-rooms', async () => {
      try {
        await connectDB();
        
        const user = await User.findById(socket.userId).populate('rooms');
        
        for (const room of user.rooms) {
          socket.join(room._id.toString());
          console.log(`User ${socket.user.username} joined room: ${room.name}`);
          
          // Notify other users in the room
          socket.to(room._id.toString()).emit('user-joined', {
            userId: socket.userId,
            username: socket.user.username,
            name: socket.user.name,
            roomId: room._id.toString()
          });
        }
      } catch (error) {
        console.error('Join rooms error:', error);
        socket.emit('error', { message: 'Failed to join rooms' });
      }
    });

    // Join a specific room
    socket.on('join-room', async (roomId) => {
      try {
        await connectDB();
        
        const chatRoom = await ChatRoom.findById(roomId);
        
        if (!chatRoom || !chatRoom.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        socket.join(roomId);
        console.log(`User ${socket.user.username} joined room: ${chatRoom.name}`);
        
        // Notify other users in the room
        socket.to(roomId).emit('user-joined', {
          userId: socket.userId,
          username: socket.user.username,
          name: socket.user.name,
          roomId
        });

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave a room
    socket.on('leave-room', async (roomId) => {
      try {
        socket.leave(roomId);
        
        // Notify other users in the room
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          username: socket.user.username,
          name: socket.user.name,
          roomId
        });
        
        console.log(`User ${socket.user.username} left room: ${roomId}`);
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        await connectDB();
        
        const { roomId, messageId } = data;
        
        // Verify user is in the room
        const chatRoom = await ChatRoom.findById(roomId);
        
        if (!chatRoom || !chatRoom.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        // Get the message with sender info
        const message = await Message.findById(messageId)
          .populate('sender', 'username name');

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Broadcast message to all users in the room
        io.to(roomId).emit('new-message', {
          message: message.toObject(),
          roomId
        });

        console.log(`Message sent in room ${chatRoom.name} by ${socket.user.username}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message edit
    socket.on('edit-message', async (data) => {
      try {
        await connectDB();
        
        const { messageId, roomId } = data;
        
        // Get the updated message
        const message = await Message.findById(messageId)
          .populate('sender', 'username name');

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Verify user owns the message
        if (message.sender._id.toString() !== socket.userId) {
          socket.emit('error', { message: 'You can only edit your own messages' });
          return;
        }

        // Add formatted edit info
        const editedTimeDisplay = message.getEditedTimeDisplay();

        // Broadcast updated message to all users in the room
        io.to(roomId).emit('message-edited', {
          message: {
            ...message.toObject(),
            editedTimeDisplay
          },
          roomId
        });

        console.log(`Message edited in room ${roomId} by ${socket.user.username}`);

      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username,
        roomId
      });
    });

    socket.on('typing-stop', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-stopped-typing', {
        userId: socket.userId,
        username: socket.user.username,
        roomId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected: ${socket.id}`);
      
      // Notify all rooms that user left
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) { // Skip the socket's own room
          socket.to(roomId).emit('user-left', {
            userId: socket.userId,
            username: socket.user.username,
            name: socket.user.name,
            roomId
          });
        }
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};