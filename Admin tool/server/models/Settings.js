const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  flagging_keywords: {
    type: [String],
    default: ['hate', 'kill', 'die', 'suicide', 'weapon', 'gun', 'drugs', 'bully', 'threat', 'hurt', 'abuse'],
  },
  daily_usage_limit: {
    type: Number,
    default: 50,
  },
  alert_inactive_days: {
    type: Number,
    default: 7,
  },
  alert_accuracy_drop: {
    type: Number,
    default: 10,
  },
  alert_min_accuracy: {
    type: Number,
    default: 40,
  },
  updatedAt: {
    type: Date,
  },
  updatedBy: {
    type: String,
  },
});

// Singleton pattern - always get or create one settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema, 'admin_settings');
