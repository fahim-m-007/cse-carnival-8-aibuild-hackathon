import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  course_title: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assigned_date: { type: String, required: true },
  deadline: { type: String, required: true },
  submission_platform: { type: String, default: 'Google Classroom' },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'submitted', 'graded', 'late']
  },
  marks: { type: Number, default: 10 }
}, { timestamps: true });

export default mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
