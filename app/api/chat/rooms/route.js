import { NextResponse } from 'next/server';
import connectDB from '@/db/connectDB.mjs';
import ChatRoom from '@/models/chatRoom.js';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Get public rooms that user hasn't joined
    const publicRooms = await ChatRoom.find({
      isPrivate: { $ne: true },
      participants: { $ne: userId }
    })
    .select('roomId name isPrivate createdAt participants')
    .sort({ createdAt: -1 })
    .limit(20);

    return NextResponse.json({ rooms: publicRooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get rooms' }, { status: 500 });
  }
}