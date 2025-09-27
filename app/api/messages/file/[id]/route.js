import { NextResponse } from 'next/server';
import connectDB from '../../../../../db/connectDB.mjs';
import { getFileStream, getFileInfo } from '../../../../../utils/fileUpload.js';
import { verifyToken, extractTokenFromHeader } from '../../../../../utils/jwt.js';
import User from '../../../../../models/user.js';
import Message from '../../../../../models/Message.js';
import ChatRoom from '../../../../../models/ChatRoom.js';

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

    const { id: fileId } = params;

    // Get file info from GridFS
    let fileInfo;
    try {
      fileInfo = await getFileInfo(fileId);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'File not found'
      }, { status: 404 });
    }

    // Find the message that contains this file
    const message = await Message.findOne({ mediaFileId: fileId });
    
    if (!message) {
      return NextResponse.json({
        success: false,
        message: 'File not associated with any message'
      }, { status: 404 });
    }

    // Check if user has access to the chatroom
    const chatRoom = await ChatRoom.findById(message.chatRoom);
    
    if (!chatRoom || !chatRoom.participants.includes(user._id)) {
      return NextResponse.json({
        success: false,
        message: 'Access denied. You are not a member of this room.'
      }, { status: 403 });
    }

    // Get file stream
    const fileStream = getFileStream(fileId);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', fileInfo.metadata.mimeType || 'application/octet-stream');
    headers.set('Content-Length', fileInfo.length.toString());
    
    // Set Content-Disposition based on file type
    const isViewableInBrowser = fileInfo.metadata.mimeType && (
      fileInfo.metadata.mimeType.startsWith('image/') ||
      fileInfo.metadata.mimeType.startsWith('video/') ||
      fileInfo.metadata.mimeType.startsWith('audio/') ||
      fileInfo.metadata.mimeType === 'application/pdf' ||
      fileInfo.metadata.mimeType.startsWith('text/')
    );
    
    if (isViewableInBrowser) {
      headers.set('Content-Disposition', `inline; filename="${fileInfo.metadata.originalName}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${fileInfo.metadata.originalName}"`);
    }

    // Create ReadableStream from GridFS stream
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        
        fileStream.on('end', () => {
          controller.close();
        });
        
        fileStream.on('error', (error) => {
          console.error('File stream error:', error);
          controller.error(error);
        });
      },
      cancel() {
        fileStream.destroy();
      }
    });

    return new Response(readableStream, { headers });

  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}