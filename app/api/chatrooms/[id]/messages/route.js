import { NextResponse } from 'next/server';
import connectDB from '../../../../../db/connectDB.mjs';
import ChatRoom from '../../../../../models/chatRoom.js';
import Message from '../../../../../models/message.js';
import User from '../../../../../models/user.js';
import { verifyToken, extractTokenFromHeader } from '../../../../../utils/jwt.js';

export async function GET(request, { params }) {
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

    const { id: roomId } = params;

    // Find chatroom by MongoDB ObjectId
    const chatRoom = await ChatRoom.findById(roomId);
    
    if (!chatRoom) {
      return NextResponse.json({
        success: false,
        message: 'Room not found'
      }, { status: 404 });
    }

    // Check if user is a participant
    if (!chatRoom.participants.includes(user._id)) {
      return NextResponse.json({
        success: false,
        message: 'You are not a member of this room'
      }, { status: 403 });
    }

    // Get last 50 messages
    const messages = await Message.find({ 
      chatRoom: chatRoom._id,
      isDeleted: false 
    })
      .populate('sender', 'username name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Reverse to show chronological order (oldest to newest)
    messages.reverse();

    // Add formatted edit info to messages
    const formattedMessages = messages.map(message => {
      if (message.isEdited && message.updatedAt) {
        const now = new Date();
        const diff = now - message.updatedAt;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        let editedTimeDisplay = 'just now';
        if (minutes >= 1 && minutes < 60) editedTimeDisplay = `${minutes}m ago`;
        else if (hours >= 1 && hours < 24) editedTimeDisplay = `${hours}h ago`;
        else if (days >= 1) editedTimeDisplay = `${days}d ago`;
        
        return {
          ...message,
          editedTimeDisplay
        };
      }
      return message;
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        room: {
          _id: chatRoom._id,
          roomId: chatRoom.roomId,
          name: chatRoom.name,
          participantCount: chatRoom.participants.length
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}