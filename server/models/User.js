import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  eduMail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  studentId: { type: String, required: true, unique: true, trim: true },
  dept: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
