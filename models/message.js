import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
		type: {
			type: String,
			enum: ["text", "image", "audio", "video", "file"],
			default: "text",
			required: true,
		},
		text: { type: String },
		mediaFileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file id
		fileName: { type: String },
		fileSize: { type: Number, max: 25 * 1024 * 1024 }, // 25MB limit
		mimeType: { type: String },
		isEdited: { type: Boolean, default: false },
		editedAt: { type: Date },
	},
	{ timestamps: true }
);

messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.models?.Message || mongoose.model("Message", messageSchema);
export default Message;
