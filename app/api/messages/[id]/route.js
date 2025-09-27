import { NextResponse } from 'next/server';
import connectDB from '../../../../db/connectDB.mjs';
import Message from '../../../../models/Message.js';
import User from '../../../../models/user.js';
import ChatRoom from '../../../../models/ChatRoom.js';
import { verifyToken, extractTokenFromHeader } from '../../../../utils/jwt.js';

export async function PUT(request, { params }) {
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

    const { id: messageId } = params;
    const { text } = await request.json();

    // Validation
    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Text cannot be empty'
      }, { status: 400 });
    }

    if (text.trim().length > 5000) {
      return NextResponse.json({
        success: false,
        message: 'Text cannot exceed 5000 characters'
      }, { status: 400 });
    }

    // Find message
    const message = await Message.findById(messageId);
    
    if (!message || message.isDeleted) {
      return NextResponse.json({
        success: false,
        message: 'Message not found'
      }, { status: 404 });
    }

    // Check if user is the sender
    if (!message.sender.equals(user._id)) {
      return NextResponse.json({
        success: false,
        message: 'You can only edit your own messages'
      }, { status: 403 });
    }

    // Check if message is text type
    if (message.type !== 'text') {
      return NextResponse.json({
        success: false,
        message: 'Only text messages can be edited'
      }, { status: 400 });
    }

    // Check if message can still be edited (within 5 minutes)
    if (!message.canEdit()) {
      return NextResponse.json({
        success: false,
        message: 'Messages can only be edited within 5 minutes of sending'
      }, { status: 403 });
    }

    // Verify user is still in the chatroom
    const chatRoom = await ChatRoom.findById(message.chatRoom);
    if (!chatRoom || !chatRoom.participants.includes(user._id)) {
      return NextResponse.json({
        success: false,
        message: 'You are no longer a member of this room'
      }, { status: 403 });
    }

    // Update message
    message.text = text.trim();
    message.isEdited = true;
    message.updatedAt = new Date();
    
    await message.save();
    
    // Populate sender info
    await message.populate('sender', 'username name');

    // Add formatted edit info
    const editedTimeDisplay = message.getEditedTimeDisplay();

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        message: {
          ...message.toObject(),
          editedTimeDisplay
        }
      }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}