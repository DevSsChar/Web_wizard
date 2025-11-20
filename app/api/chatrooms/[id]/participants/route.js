import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/db/connectDB.mjs';
import ChatRoom from '@/models/chatRoom';
import User from '@/models/user';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = params;
    await connectDB();

    const room = await ChatRoom.findOne({ roomId })
      .populate('participants', 'name email image username')
      .lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      participants: room.participants || [],
      roomInfo: {
        name: room.name,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get participants' }, { status: 500 });
  }
}
