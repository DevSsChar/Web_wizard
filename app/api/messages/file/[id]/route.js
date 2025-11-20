import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import connectDB from '@/db/connectDB.mjs';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.user?.isProfileCompleted) return NextResponse.json({ error: 'PROFILE_INCOMPLETE' }, { status: 403 });
    await connectDB();
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const id = params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const stream = bucket.openDownloadStream(objectId);
    return new Response(stream, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
