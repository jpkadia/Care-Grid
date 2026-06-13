const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ChatConversationSchema = new mongoose.Schema({
  ownerType: { type: String, enum: ['doctor', 'admin'], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  messages: { type: [ChatMessageSchema], default: [] }
}, { timestamps: true });

ChatConversationSchema.index({ ownerType: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('ChatConversation', ChatConversationSchema);
