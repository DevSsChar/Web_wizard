import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const chatRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      length: 6,
      match: /^\d{6}$/,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
    },
    inviteLink: {
      type: String,
      required: true,
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
chatRoomSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
chatRoomSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate unique 6-digit roomId
chatRoomSchema.statics.generateUniqueRoomId = async function() {
  let roomId;
  let exists = true;

  while (exists) {
    roomId = Math.floor(100000 + Math.random() * 900000).toString();
    const existingRoom = await this.findOne({ roomId });
    exists = !!existingRoom;
  }

  return roomId;
};

// Remove password from JSON output
chatRoomSchema.methods.toJSON = function() {
  const room = this.toObject();
  delete room.password;
  return room;
};

const ChatRoom = mongoose.models?.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
