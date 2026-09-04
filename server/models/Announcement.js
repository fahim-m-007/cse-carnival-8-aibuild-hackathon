import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: String, required: true },
  priority: { type: String, required: true, enum: ['high', 'medium', 'low'] },
  posted_by: { type: String, required: true },
  expires: { type: String }
}, { timestamps: true });

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
