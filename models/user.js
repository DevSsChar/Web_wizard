import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    company: {
      type: String,
    },
    website: {
      type: String,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models?.User || mongoose.model("User", userSchema);

export default User;
