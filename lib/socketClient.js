import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
  }

  connect(token) {
    if (!token) {
      console.error('Token is required for socket connection');
      return;
    }

    this.token = token;
    
    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    const serverUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupEventListeners();
    
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.joinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinRooms() {
    if (this.socket) {
      this.socket.emit('join-rooms');
    }
  }

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leave-room', roomId);
    }
  }

  sendMessage(roomId, messageId) {
    if (this.socket) {
      this.socket.emit('send-message', { roomId, messageId });
    }
  }

  editMessage(messageId, roomId) {
    if (this.socket) {
      this.socket.emit('edit-message', { messageId, roomId });
    }
  }

  startTyping(roomId) {
    if (this.socket) {
      this.socket.emit('typing-start', { roomId });
    }
  }

  stopTyping(roomId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { roomId });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onMessageEdited(callback) {
    if (this.socket) {
      this.socket.on('message-edited', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stopped-typing', callback);
    }
  }

  // Remove specific event listeners
  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new-message', callback);
    }
  }

  offMessageEdited(callback) {
    if (this.socket) {
      this.socket.off('message-edited', callback);
    }
  }

  offUserJoined(callback) {
    if (this.socket) {
      this.socket.off('user-joined', callback);
    }
  }

  offUserLeft(callback) {
    if (this.socket) {
      this.socket.off('user-left', callback);
    }
  }

  offUserTyping(callback) {
    if (this.socket) {
      this.socket.off('user-typing', callback);
    }
  }

  offUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.off('user-stopped-typing', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;