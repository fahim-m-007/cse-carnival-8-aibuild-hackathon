import { store } from '../config/db.js';

export const getRooms = (req, res) => {
  const { type, min_capacity, equipment } = req.query;
  let list = store.getAll('rooms');
  if (type) list = list.filter(r => r.type.toLowerCase() === type.toLowerCase());
  if (min_capacity) list = list.filter(r => r.capacity >= Number(min_capacity));
  if (equipment) {
    const requiredEq = equipment.split(',').map(s => s.trim().toLowerCase());
    list = list.filter(r => requiredEq.every(eq => r.equipment?.map(x => x.toLowerCase()).includes(eq)));
  }
  res.json(list);
};

export const createRoom = (req, res) => {
  const item = {
    id: req.body.id || `room-${Date.now().toString().slice(-4)}`,
    room_number: req.body.room_number,
    type: req.body.type || 'classroom',
    capacity: Number(req.body.capacity) || 40,
    equipment: Array.isArray(req.body.equipment) ? req.body.equipment : ['whiteboard', 'projector', 'AC'],
    floor: Number(req.body.floor) || 7,
    status: req.body.status || 'available',
    bookings: req.body.bookings || []
  };
  const created = store.insert('rooms', item);
  res.status(201).json(created);
};

export const updateRoom = (req, res) => {
  const { id } = req.params;
  const updated = store.update('rooms', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Room not found' });
  res.json(updated);
};

export const deleteRoom = (req, res) => {
  const { id } = req.params;
  const deleted = store.delete('rooms', id);
  if (!deleted) return res.status(404).json({ error: 'Room not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};

// Extra Action: Book Room
export const bookRoom = (req, res) => {
  const { id } = req.params;
  const { date, start_time, end_time, booked_by, purpose } = req.body;

  if (!date || !start_time || !end_time || !booked_by) {
    return res.status(400).json({ error: 'Missing required booking fields: date, start_time, end_time, booked_by' });
  }

  const room = store.getById('rooms', id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  // Conflict Check
  const bookings = room.bookings || [];
  const hasConflict = bookings.some(b => {
    if (b.date !== date) return false;
    // Overlapping times: (start1 < end2) && (end1 > start2)
    return (start_time < b.end_time) && (end_time > b.start_time);
  });

  if (hasConflict) {
    return res.status(409).json({ error: `Room ${room.room_number} is already booked on ${date} during that time.` });
  }

  const newBooking = {
    booking_id: `bk-${Date.now().toString().slice(-4)}`,
    booked_by,
    date,
    start_time,
    end_time,
    purpose: purpose || 'General Booking'
  };

  room.bookings = bookings;
  room.bookings.push(newBooking);
  store.update('rooms', room.id, { bookings: room.bookings });

  res.status(201).json({ success: true, booking: newBooking, room });
};

// Extra Action: Cancel Room Booking
export const cancelRoomBooking = (req, res) => {
  const { id } = req.params;
  const { booking_id } = req.body;

  const room = store.getById('rooms', id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const initialCount = (room.bookings || []).length;
  room.bookings = (room.bookings || []).filter(b => b.booking_id !== booking_id);

  if (room.bookings.length === initialCount) {
    return res.status(404).json({ error: 'Booking ID not found' });
  }

  store.update('rooms', room.id, { bookings: room.bookings });
  res.json({ success: true, message: 'Booking cancelled' });
};
