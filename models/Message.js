import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'file'],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 5000,
      // Required only for text messages
      validate: {
        validator: function(v) {
          return this.type === 'text' ? !!v && v.length > 0 : true;
        },
        message: 'Text is required for text messages'
      }
    },
    mediaFileId: {
      type: mongoose.Schema.Types.ObjectId,
      // Required for non-text messages
      validate: {
        validator: function(v) {
          return this.type !== 'text' ? !!v : true;
        },
        message: 'Media file ID is required for non-text messages'
      }
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      max: 25 * 1024 * 1024, // 25MB in bytes
      validate: {
        validator: function(v) {
          return this.type !== 'text' ? v <= 25 * 1024 * 1024 : true;
        },
        message: 'File size cannot exceed 25MB'
      }
    },
    mimeType: {
      type: String,
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    updatedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Method to check if message can be edited (within 5 minutes)
messageSchema.methods.canEdit = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.createdAt > fiveMinutesAgo;
};

// Method to format edited time for display
messageSchema.methods.getEditedTimeDisplay = function() {
  if (!this.isEdited || !this.updatedAt) return null;
  
  const now = new Date();
  const diff = now - this.updatedAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Virtual for formatted message with edit info
messageSchema.virtual('formattedMessage').get(function() {
  const message = this.toObject();
  if (this.isEdited) {
    message.editedTimeDisplay = this.getEditedTimeDisplay();
  }
  return message;
});

const Message = mongoose.models?.Message || mongoose.model("Message", messageSchema);

export default Message;