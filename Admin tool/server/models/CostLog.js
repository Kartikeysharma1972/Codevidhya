const mongoose = require('mongoose');

const costLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  platform: {
    type: String,
    enum: ['classroom-ai', 'ai-tutor'],
    required: true,
  },
  tool: {
    type: String,
  },
  api_calls: {
    type: Number,
    default: 0,
  },
  estimated_tokens: {
    type: Number,
    default: 0,
  },
  estimated_cost_usd: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CostLog', costLogSchema, 'costlogs');
