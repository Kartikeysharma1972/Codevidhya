import mongoose from 'mongoose';

// One row per question a student has already been shown by any question
// generator (mock test, worksheet, etc.). Used to guarantee questions never
// repeat for the same student on the same subject.
const servedQuestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: Number,
  subject: { type: String, required: true },
  chapter: String,
  tool: String,
  hash: { type: String, required: true },
  text: String,
}, { timestamps: true });

// Fast lookup of "what has this student already seen for this subject".
servedQuestionSchema.index({ userId: 1, subject: 1, createdAt: -1 });
// Same student + subject + identical question can only be stored once.
servedQuestionSchema.index({ userId: 1, subject: 1, hash: 1 }, { unique: true });

export default mongoose.model('ServedQuestion', servedQuestionSchema);
