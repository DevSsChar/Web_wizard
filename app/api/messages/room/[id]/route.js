import { NextResponse } from 'next/server';
import connectDB from '../../../../../db/connectDB.mjs';
import ChatRoom from '../../../../../models/ChatRoom.js';
import Message from '../../../../../models/Message.js';
import User from '../../../../../models/user.js';
import { verifyToken, extractTokenFromHeader } from '../../../../../utils/jwt.js';
import { upload, uploadToGridFS, getMessageTypeFromMimeType } from '../../../../../utils/fileUpload.js';

export async function POST(request, { params }) {
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
    
    // Find chatroom
    const chatRoom = await ChatRoom.findById(roomId);
    
    if (!chatRoom || !chatRoom.isActive) {
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

    // Handle form data (for file uploads) or JSON data (for text messages)
    const contentType = request.headers.get('content-type');
    let messageData = {};
    let file = null;

    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const textData = formData.get('data');
      if (textData) {
        messageData = JSON.parse(textData);
      }
      file = formData.get('file');
    } else {
      messageData = await request.json();
    }

    const { type, text } = messageData;

    // Validation
    if (!type || !['text', 'image', 'audio', 'video', 'file'].includes(type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid message type'
      }, { status: 400 });
    }

    let messagePayload = {
      chatRoom: chatRoom._id,
      sender: user._id,
      type,
    };

    if (type === 'text') {
      if (!text || text.trim().length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Text message cannot be empty'
        }, { status: 400 });
      }
      messagePayload.text = text.trim();
    } else {
      // Handle file upload
      if (!file) {
        return NextResponse.json({
          success: false,
          message: 'File is required for non-text messages'
        }, { status: 400 });
      }

      // Validate file size
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          message: 'File size cannot exceed 25MB'
        }, { status: 400 });
      }

      // Verify message type matches file type
      const fileType = getMessageTypeFromMimeType(file.type);
      if (type !== fileType && type !== 'file') {
        return NextResponse.json({
          success: false,
          message: `File type ${file.type} doesn't match message type ${type}`
        }, { status: 400 });
      }

      try {
        // Convert File to buffer for GridFS upload
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileData = {
          originalname: file.name,
          buffer,
          mimetype: file.type,
          size: file.size
        };

        const uploadResult = await uploadToGridFS(fileData, {
          chatRoomId: chatRoom._id,
          senderId: user._id
        });

        messagePayload = {
          ...messagePayload,
          mediaFileId: uploadResult.fileId,
          fileName: uploadResult.originalName,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimeType,
        };
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return NextResponse.json({
          success: false,
          message: 'Failed to upload file'
        }, { status: 500 });
      }
    }

    // Create message
    const message = new Message(messagePayload);
    await message.save();

    // Add message to chatroom
    chatRoom.messages.push(message._id);
    await chatRoom.save();

    // Populate message with sender info
    await message.populate('sender', 'username name');

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    }, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}