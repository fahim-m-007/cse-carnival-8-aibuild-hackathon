import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  title: { type: String, required: true },
  day: { type: String, required: true, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  room: { type: String, required: true },
  instructor: { type: String, default: 'TBA' },
  section: { type: String, default: 'A' }
}, { timestamps: true });

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
