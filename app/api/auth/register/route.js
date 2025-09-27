import { NextResponse } from 'next/server';
import connectDB from '../../../../db/connectDB.mjs';
import User from '../../../../models/user.js';
import { generateToken } from '../../../../utils/jwt.js';

export async function POST(request) {
  try {
    await connectDB();
    
    const { username, email, password, name } = await request.json();

    // Validation
    if (!username || !email || !password || !name) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email or username already exists'
      }, { status: 409 });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      name,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json({
        success: false,
        message: `${field} already exists`
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}