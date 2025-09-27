import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureDB } from '@/backend/actions';
import User from '@/models/user';
import ChatRoom from '@/models/chatRoom';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDB();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id: roomId } = params;
    
    // Find the room and populate participants
    const room = await ChatRoom.findOne({ roomId })
      .populate('participants', 'name username email image isOnline createdAt')
      .lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(p => p._id.toString() === dbUser._id.toString());
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Add role information and format participants
    const participants = room.participants.map(participant => ({
      _id: participant._id,
      name: participant.name,
      username: participant.username,
      email: participant.email,
      image: participant.image,
      isOnline: participant.isOnline || Math.random() > 0.5, // Mock online status
      role: participant._id.toString() === room.participants[0]._id.toString() ? 'admin' : 'member',
      joinedAt: participant.createdAt || new Date()
    }));

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get participants' }, { status: 500 });
  }
}