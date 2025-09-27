import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { editMessage, presentMessage, ensureDB } from '@/backend/actions';
import User from '@/models/user';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureDB();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser?.isProfileCompleted) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 });
    const body = await req.json();
    const { text } = body;
  const msg = await editMessage({ messageId: params.id, userId: dbUser._id, newText: text });
    return NextResponse.json({ message: presentMessage(msg) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
