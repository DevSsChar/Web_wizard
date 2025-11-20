import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { joinChatRoom, ensureDB } from '@/backend/actions';
import User from '@/models/user';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureDB();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser?.isProfileCompleted) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 });
    const body = await req.json();
    const { roomId, password } = body;
  const room = await joinChatRoom({ userId: dbUser._id, roomId, password });
    return NextResponse.json({ room });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
