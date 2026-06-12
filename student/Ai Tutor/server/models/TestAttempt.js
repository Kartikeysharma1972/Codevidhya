import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: String,
  type: String,
  options: [String],
  pairs: [{ left: String, right: String }],
  items: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  studentAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  explanation: String,
  studyNotes: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  topic: String,
  timeTaken: Number,
  timeTakenSeconds: Number,
});

const testAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  chapters: [String],
  grade: { type: Number, required: true },
  questions: [questionSchema],
  score: Number,
  totalQuestions: Number,
  accuracy: Number,
  timeTaken: Number,
  timeAllotted: Number,
  topicWiseAccuracy: mongoose.Schema.Types.Mixed,
  weakAreas: [String],
  percentileRank: Number,
}, { timestamps: true });

export default mongoose.model('TestAttempt', testAttemptSchema);
