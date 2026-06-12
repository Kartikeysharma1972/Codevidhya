import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  images: [String],
  timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tool: {
    type: String,
    enum: ['concept-explainer', 'document-summarizer', 'project-generator', 'exam-prep'],
    required: true,
  },
  title: { type: String, default: 'New Session' },
  messages: [messageSchema],
  metadata: {
    subject: String,
    chapter: String,
    topic: String,
    explanationLevel: String,
    summarizationMode: String,
    projectType: String,
  },
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
