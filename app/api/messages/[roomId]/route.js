import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { sendMessage, presentMessage, ensureDB } from '@/backend/actions';
import User from '@/models/user';

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureDB();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser?.isProfileCompleted) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 });
    const body = await req.json();
    const { type, text } = body;
  const msg = await sendMessage({ roomId: params.roomId, senderId: dbUser._id, type, text });
    return NextResponse.json({ message: presentMessage(msg) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
