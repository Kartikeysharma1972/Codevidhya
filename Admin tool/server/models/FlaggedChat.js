const mongoose = require('mongoose');

const flaggedChatSchema = new mongoose.Schema({
  chatType: {
    type: String,
    enum: ['teacher', 'student'],
    required: true,
  },
  chatId: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  flaggedBy: {
    type: String,
  },
  autoFlagged: {
    type: Boolean,
    default: false,
  },
  keywords: [String],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'escalated', 'dismissed'],
    default: 'pending',
  },
  reviewedBy: {
    type: String,
  },
  reviewNotes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('FlaggedChat', flaggedChatSchema, 'flaggedchats');
