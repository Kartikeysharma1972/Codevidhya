import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    schoolName: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    grade: {
      type: Number,
      min: 1,
      max: 12,
      validate: {
        validator: function (v) {
          if (this.role === 'student') return v != null && v >= 1 && v <= 12;
          return v == null;
        },
        message: 'Grade is required for students and must be between 1 and 12.',
      },
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    schoolName: this.schoolName,
    role: this.role,
    grade: this.grade ?? null,
  };
};

export default mongoose.model('PortalUser', userSchema);
