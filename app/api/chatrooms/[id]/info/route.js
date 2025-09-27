import { NextResponse } from 'next/server';
import connectDB from '@/db/connectDB.mjs';
import ChatRoom from '@/models/chatRoom';

export async function GET(request, { params }) {
  try {
    const { id: roomId } = params;
    await connectDB();

    const room = await ChatRoom.findOne({ roomId })
      .select('roomId name isPrivate createdAt participants')
      .lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      room: {
        roomId: room.roomId,
        name: room.name,
        isPrivate: room.isPrivate,
        participantCount: room.participants?.length || 0,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Get room info error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get room info' }, { status: 500 });
  }
}