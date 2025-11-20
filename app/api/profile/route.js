import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/db/connectDB";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, username, phone, location, company, website, image } = body;

    await connectDB();
    
    // Check if username is already taken (if provided)
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        email: { $ne: session.user.email } 
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: "Username already taken" 
        }, { status: 400 });
      }
    }

    // Check if profile is complete (has at least name, bio, and username)
    const profileComplete = !!(
      (name || session.user.name) &&
      bio &&
      username
    );

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: name || session.user.name,
          bio,
          username,
          phone,
          location,
          company,
          website,
          image: image || session.user.image,
          isProfileCompleted: profileComplete,
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Username already exists" 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}