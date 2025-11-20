import { NextResponse } from 'next/server';
import connectDB from '../../../../db/connectDB.mjs';
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

    const { roomId, password } = await request.json();

    // Validation
    if (!roomId || !password) {
      return NextResponse.json({
        success: false,
        message: 'Room ID and password are required'
      }, { status: 400 });
    }

    if (!/^\d{6}$/.test(roomId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid room ID format'
      }, { status: 400 });
    }

    // Find chatroom
    const chatRoom = await ChatRoom.findOne({ roomId, isActive: true });
    
    if (!chatRoom) {
      return NextResponse.json({
        success: false,
        message: 'Room not found'
      }, { status: 404 });
    }

    // Check if user is already in the room
    if (chatRoom.participants.includes(user._id)) {
      return NextResponse.json({
        success: false,
        message: 'You are already in this room'
      }, { status: 409 });
    }

    // Verify password
    const isPasswordValid = await chatRoom.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid room password'
      }, { status: 401 });
    }

    // Add user to chatroom participants
    chatRoom.participants.push(user._id);
    await chatRoom.save();

    // Add room to user's rooms
    user.rooms.push(chatRoom._id);
    await user.save();

    // Populate chatroom data
    await chatRoom.populate([
      { path: 'participants', select: 'username name email' },
      { path: 'createdBy', select: 'username name email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the room',
      data: { chatRoom }
    });

  } catch (error) {
    console.error('Join chatroom error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
