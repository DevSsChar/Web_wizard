import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import connectDB from '../db/connectDB.mjs';
import {
	createChatRoom,
	joinChatRoom,
	getLastMessages,
	sendMessage,
	editMessage,
	presentMessage,
} from './actions.js';
import User from '../models/user.js';
import ChatRoom from '../models/chatRoom.js';
import Message from '../models/message.js';

const app = express();
// Configure CORS explicitly; wildcard + credentials is invalid, so prefer explicit origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o=>o.trim());
app.use(cors({ origin: (origin, cb)=> {
	if (!origin) return cb(null, true); // allow same-origin / server-to-server
	if (allowedOrigins.includes(origin)) return cb(null, true);
	return cb(new Error('Not allowed by CORS'));
}, credentials: true }));
app.use(express.json());

// File storage (GridFS)
const storage = new GridFsStorage({
	url: process.env.MONGODB_URI,
	file: (req, file) => {
		return {
			filename: `${Date.now()}-${file.originalname}`,
			bucketName: 'uploads',
		};
	},
});
const upload = multer({
	storage,
	limits: { fileSize: 25 * 1024 * 1024 },
});

function authMiddleware(req, res, next) {
	const header = req.headers.authorization;
	if (!header) return res.status(401).json({ error: 'No token' });
	const token = header.split(' ')[1];
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
		req.user = decoded;
		next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

async function profileCompleted(req, res, next) {
	await connectDB();
	const user = await User.findById(req.user.id);
	if (!user) return res.status(404).json({ error: 'User not found' });
	if (!user.isProfileCompleted) {
		return res.status(403).json({ error: 'PROFILE_INCOMPLETE' });
	}
	req.dbUser = user;
	next();
}

// Routes
app.post('/api/chatrooms', authMiddleware, profileCompleted, async (req, res) => {
	try {
		const { name, password, isPrivate } = req.body;
		const room = await createChatRoom({ name, password, isPrivate, creatorUserId: req.user.id });
		res.json({ room });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/chatrooms/join', authMiddleware, profileCompleted, async (req, res) => {
	try {
		const { roomId, password } = req.body;
		const room = await joinChatRoom({ userId: req.user.id, roomId, password });
		res.json({ room });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/chatrooms/:id/messages', authMiddleware, profileCompleted, async (req, res) => {
	try {
		const data = await getLastMessages({ roomId: req.params.id });
		res.json({ messages: data });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/messages/:roomId', authMiddleware, profileCompleted, upload.single('file'), async (req, res) => {
	try {
		const { type, text } = req.body;
		let fileMeta;
		if (req.file) {
			fileMeta = {
				fileId: req.file.id,
				fileName: req.file.filename,
				fileSize: req.file.size,
				mimeType: req.file.mimetype,
			};
		}
		const msg = await sendMessage({ roomId: req.params.roomId, senderId: req.user.id, type, text, fileMeta });
		res.json({ message: presentMessage(msg) });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/messages/:id', authMiddleware, profileCompleted, async (req, res) => {
	try {
		const { text } = req.body;
		const msg = await editMessage({ messageId: req.params.id, userId: req.user.id, newText: text });
		res.json({ message: presentMessage(msg) });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/messages/file/:id', authMiddleware, profileCompleted, async (req, res) => {
	await connectDB();
	const conn = mongoose.connection;
	const gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
	try {
		const _id = new mongoose.Types.ObjectId(req.params.id);
		gfs.openDownloadStream(_id).on('error', () => res.status(404).json({ error: 'File not found' })).pipe(res);
	} catch {
		res.status(400).json({ error: 'Invalid file id' });
	}
});

// Socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, { 
	cors: { origin: allowedOrigins, credentials: false },
	pingTimeout: 30000,
	pingInterval: 25000,
});

io.use(async (socket, next) => {
	const token = socket.handshake.auth?.token;
	if (!token) return next(new Error('No token'));
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
		await connectDB();
		const user = await User.findById(decoded.id);
		if (!user) return next(new Error('User not found'));
		if (!user.isProfileCompleted) return next(new Error('PROFILE_INCOMPLETE'));
		socket.user = { id: user._id.toString(), name: user.name };
		next();
	} catch (e) { 
		console.error('Socket auth failed', e);
		next(new Error('Auth failed')); 
	}
});

io.on('connection', (socket) => {
	socket.on('joinRoom', async ({ roomId }) => {
		try {
			const room = await ChatRoom.findOne({ roomId });
			if (!room) return socket.emit('error', 'Room not found');
			
			// Add user to room participants if not already there
			if (!room.participants.includes(socket.user.id)) {
				room.participants.push(socket.user.id);
				await room.save();
			}
			
			socket.join(roomId);
			const history = await getLastMessages({ roomId });
			console.log(`Sending history for room ${roomId}:`, history.length, 'messages');
			socket.emit('history', { roomId, messages: history });
			
			// Notify other users about join
			socket.to(roomId).emit('system', {
				roomId,
				message: `${socket.user.name} joined the chat`,
				type: 'join'
			});
			
			// Send room info back to client
			socket.emit('roomJoined', { room });
			
		} catch (e) { 
			console.error('joinRoom error', e);
			socket.emit('error', e.message); 
		}
	});

	socket.on('leaveRoom', async ({ roomId }) => {
		try {
			// Remove user from room participants
			const room = await ChatRoom.findOne({ roomId });
			if (room) {
				room.participants = room.participants.filter(p => p.toString() !== socket.user.id);
				await room.save();
			}
			
			socket.leave(roomId);
			
			// Notify other users about leave
			socket.to(roomId).emit('system', {
				roomId,
				message: `${socket.user.name} left the chat`,
				type: 'leave'
			});
		} catch (e) {
			console.error('leaveRoom error', e);
		}
	});
	
	// Typing indicators
	socket.on('typing', ({ roomId, isTyping }) => {
		socket.to(roomId).emit('userTyping', {
			roomId,
			username: socket.user.name,
			isTyping
		});
	});

	socket.on('newMessage', async ({ roomId, type, text }) => {
		try {
			if (!text || !text.trim()) {
				return socket.emit('error', 'Message text is required');
			}
			
			const msg = await sendMessage({ roomId, senderId: socket.user.id, type: type || 'text', text: text.trim() });
			const payload = { ...presentMessage(msg), roomId };
			console.log('Broadcasting message to room:', roomId, payload);
			io.to(roomId).emit('message', payload);
		} catch (e) { 
			console.error('newMessage error', e);
			socket.emit('error', e.message); 
		}
	});

	socket.on('editMessage', async ({ messageId, newText }) => {
		try {
			const msg = await editMessage({ messageId, userId: socket.user.id, newText });
			io.to(msg.room.toString()).emit('messageEdited', { ...presentMessage(msg), room: msg.room.toString() });
		} catch (e) { 
			console.error('editMessage error', e);
			socket.emit('error', e.message); 
		}
	});
	
	// Handle disconnect
	socket.on('disconnect', (reason) => {
		console.log(`User ${socket.user?.name} disconnected:`, reason);
		// Note: socket.rooms contains all rooms the user was in
		// Notify all rooms about user disconnect if needed
	});
});

// Simple health endpoint
app.get('/health', (req,res)=> res.json({ ok: true, uptime: process.uptime() }));

export function startServer(port = process.env.PORT || 4000) {
	console.log('[startup] Attempting initial DB connection...');
	connectDB().then(()=> console.log('[startup] DB connected (initial)')).catch(err=> console.error('[startup] DB connect error', err));
	server.listen(port, () => {
		console.log(`Backend server running on port ${port}`);
		console.log('Allowed origins:', allowedOrigins.join(', '));
	});
	server.on('error', (err)=> console.error('[server error]', err));
	return server;
}

// If executed directly (node backend/server.mjs)
console.log('[debug] process.argv[1]:', process.argv[1]);
console.log('[debug] import.meta.url:', import.meta.url);
console.log('[debug] Starting server...');
startServer();

