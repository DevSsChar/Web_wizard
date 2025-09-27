// Centralized backend actions & helpers (Node/Express style) to be reused inside Next.js route handlers
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
// Use relative paths so this module works when executed directly by Node (outside Next.js alias resolution)
import connectDB from '../db/connectDB.mjs';
import ChatRoom from '../models/chatRoom.js';
import Message from '../models/message.js';
import User from '../models/user.js';

export async function ensureDB() {
	await connectDB();
}

export function generateRoomId() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export function buildInviteLink(roomId) {
	// In real deployment use process.env.NEXT_PUBLIC_APP_URL
	const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
	return `${base}/join/${roomId}`;
}

export async function createChatRoom({ name, password, isPrivate, creatorUserId }) {
	await ensureDB();
	let roomId; let exists = true; let attempt = 0;
	while (exists && attempt < 5) {
		roomId = generateRoomId();
		exists = await ChatRoom.findOne({ roomId });
		attempt++;
	}
	if (exists) throw new Error('Failed to generate unique roomId');

	const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
	const inviteLink = buildInviteLink(roomId);

	const room = await ChatRoom.create({
		roomId,
		name,
		passwordHash,
		inviteLink,
		isPrivate: !!isPrivate,
		participants: [creatorUserId],
	});
	return room;
}

export async function joinChatRoom({ userId, roomId, password }) {
	await ensureDB();
	const room = await ChatRoom.findOne({ roomId });
	if (!room) throw new Error('Room not found');

	if (room.passwordHash) {
		const ok = await bcrypt.compare(password || '', room.passwordHash);
		if (!ok) throw new Error('Invalid password');
	}

	if (!room.participants.some(p => p.toString() === userId.toString())) {
		room.participants.push(userId);
		await room.save();
	}
	return room;
}

export async function getLastMessages({ roomId, limit = 50 }) {
	await ensureDB();
	const room = await ChatRoom.findOne({ roomId });
	if (!room) throw new Error('Room not found');
	const messages = await Message.find({ room: room._id })
		.sort({ createdAt: -1 })
		.limit(limit)
		.populate('sender', 'name image username')
		.lean();
	return messages.reverse(); // chronological
}

export async function sendMessage({ roomId, senderId, type, text, fileMeta }) {
	await ensureDB();
	const room = await ChatRoom.findOne({ roomId });
	if (!room) throw new Error('Room not found');

	const doc = await Message.create({
		room: room._id,
		sender: senderId,
		type: type || 'text',
		text: text || undefined,
		mediaFileId: fileMeta?.fileId,
		fileName: fileMeta?.fileName,
		fileSize: fileMeta?.fileSize,
		mimeType: fileMeta?.mimeType,
	});
	room.messages.push(doc._id);
	await room.save();
	return await doc.populate('sender', 'name image username');
}

export async function editMessage({ messageId, userId, newText }) {
	await ensureDB();
	const msg = await Message.findById(messageId);
	if (!msg) throw new Error('Message not found');
	if (msg.sender.toString() !== userId.toString()) throw new Error('Forbidden');
	const createdAt = msg.createdAt.getTime();
	if (Date.now() - createdAt > 5 * 60 * 1000) {
		throw new Error('Edit window expired');
	}
	msg.text = newText;
	msg.isEdited = true;
	msg.editedAt = new Date();
	await msg.save();
	return await msg.populate('sender', 'name image username');
}

export async function requireProfileCompleted(userEmail) {
	await ensureDB();
	const user = await User.findOne({ email: userEmail });
	if (!user) throw new Error('User not found');
	if (!user.isProfileCompleted) {
		const err = new Error('PROFILE_INCOMPLETE');
		err.code = 'PROFILE_INCOMPLETE';
		throw err;
	}
	return user;
}

// Utility to format messages for API responses
export function presentMessage(msg) {
	return {
		id: msg._id.toString(),
		room: msg.room?.toString?.() || msg.room,
		sender: msg.sender,
		type: msg.type,
		text: msg.text,
		mediaFileId: msg.mediaFileId,
		fileName: msg.fileName,
		fileSize: msg.fileSize,
		mimeType: msg.mimeType,
		isEdited: msg.isEdited,
		editedAt: msg.editedAt,
		createdAt: msg.createdAt,
	};
}

export function errorResponse(message, status = 400) {
	return { error: message, status };
}

