import { NextResponse } from 'next/server';
import connectDB from '../../../db/connectDB.mjs';
import ChatRoom from '../../../models/chatRoom.js';
import User from '../../../models/user.js';
import { verifyToken, extractTokenFromHeader } from '../../../utils/jwt.js';

export async function POST(request) {
  try {
    await connectDB();
    
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Access denied. No token provided.'
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const { name, password } = await request.json();

    // Validation
    if (!name || !password) {
      return NextResponse.json({
        success: false,
        message: 'Room name and password are required'
      }, { status: 400 });
    }

    if (name.length < 3 || name.length > 100) {
      return NextResponse.json({
        success: false,
        message: 'Room name must be between 3 and 100 characters'
      }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 4 characters long'
      }, { status: 400 });
    }

    // Generate unique 6-digit roomId
    const roomId = await ChatRoom.generateUniqueRoomId();
    
    // Create invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/join/${roomId}`;

    // Create chatroom
    const chatRoom = new ChatRoom({
      roomId,
      name,
      password,
      inviteLink,
      participants: [user._id],
      createdBy: user._id,
    });

    await chatRoom.save();

    // Add room to user's rooms
    user.rooms.push(chatRoom._id);
    await user.save();

    // Populate created room data
    await chatRoom.populate([
      { path: 'participants', select: 'username name email' },
      { path: 'createdBy', select: 'username name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Chatroom created successfully',
      data: { chatRoom }
    }, { status: 201 });

  } catch (error) {
    console.error('Create chatroom error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
