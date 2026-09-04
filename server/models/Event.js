import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  end_date: { type: String },
  venue: { type: String, required: true },
  organizer: { type: String, default: 'Campus' },
  capacity: { type: Number, required: true },
  registered: { type: Number, default: 0 },
  registrations: [RegistrationSchema],
  status: {
    type: String,
    default: 'upcoming',
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'full']
  }
}, { timestamps: true });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
