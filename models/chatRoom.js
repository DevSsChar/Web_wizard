import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
	{
		roomId: {
			type: String,
			required: true,
			unique: true,
			match: /^[0-9]{6}$/,
			index: true,
		},
		name: { type: String, required: true },
		passwordHash: { type: String }, // bcrypt hash if password protected
		inviteLink: { type: String, required: true },
		isPrivate: { type: Boolean, default: false },
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
			},
		],
	},
	{ timestamps: true }
);

const ChatRoom = mongoose.models?.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);
export default ChatRoom;
