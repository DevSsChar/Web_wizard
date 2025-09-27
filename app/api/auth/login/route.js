import { NextResponse } from 'next/server';
import connectDB from '../../../../db/connectDB.mjs';
import User from '../../../../models/user.js';
import { generateToken } from '../../../../utils/jwt.js';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, username, password } = await request.json();

    // Validation
    if ((!email && !username) || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email/username and password are required'
      }, { status: 400 });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email || '' },
        { username: username || '' }
      ]
    });

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}