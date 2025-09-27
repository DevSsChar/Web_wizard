import { NextResponse } from 'next/server';
import connectDB from '../../../../db/connectDB.mjs';
import User from '../../../../models/user.js';
import { verifyToken, extractTokenFromHeader } from '../../../../utils/jwt.js';

export async function GET(request) {
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
    const user = await User.findById(decoded.userId)
      .populate('rooms', 'roomId name inviteLink participants')
      .select('-password');
    
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Invalid token'
    }, { status: 401 });
  }
}