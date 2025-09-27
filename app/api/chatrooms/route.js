import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import { createChatRoom, ensureDB } from '@/backend/actions';
import User from '@/models/user';
import ChatRoom from '@/models/chatRoom';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureDB();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    // Get user's joined rooms
    const joinedRooms = await ChatRoom.find({ 
      participants: dbUser._id 
    }).select('roomId name isPrivate createdAt participants').lean();
    
    // Get public rooms that user hasn't joined
    const publicRooms = await ChatRoom.find({
      isPrivate: { $ne: true },
      participants: { $ne: dbUser._id }
    }).select('roomId name isPrivate createdAt participants').limit(20).lean();
    
    return NextResponse.json({ 
      joinedRooms: joinedRooms || [],
      publicRooms: publicRooms || []
    });
  } catch (e) {
    console.error('GET /api/chatrooms error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureDB();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!dbUser.isProfileCompleted) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 });
    const body = await req.json();
    const { name, password, isPrivate } = body;
    const room = await createChatRoom({ name, password, isPrivate, creatorUserId: dbUser._id });
    return NextResponse.json({ room });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
