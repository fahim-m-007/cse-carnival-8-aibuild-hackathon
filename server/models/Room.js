import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  booking_id: { type: String, required: true },
  booked_by: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  purpose: { type: String, default: 'General Reservation' }
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  room_number: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['classroom', 'lab', 'seminar'] },
  capacity: { type: Number, required: true },
  equipment: [{ type: String }],
  floor: { type: Number, default: 7 },
  status: { type: String, default: 'available', enum: ['available', 'unavailable'] },
  bookings: [BookingSchema]
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
