import { store, isMongoConnected, broadcastDataChange } from '../config/db.js';
import Room from '../models/Room.js';

export const getRooms = async (req, res) => {
  const { type, min_capacity, equipment } = req.query;
  try {
    if (isMongoConnected()) {
      const filter = {};
      if (type) filter.type = type.toLowerCase();
      if (min_capacity) filter.capacity = { $gte: Number(min_capacity) };
      if (equipment) {
        const requiredEq = equipment.split(',').map(s => s.trim().toLowerCase());
        filter.equipment = { $all: requiredEq };
      }
      const list = await Room.find(filter).lean();
      return res.json(list);
    }
  } catch (e) {
    console.error('[Rooms GET Error]:', e);
  }

  let list = store.getAll('rooms');
  if (type) list = list.filter(r => r.type.toLowerCase() === type.toLowerCase());
  if (min_capacity) list = list.filter(r => r.capacity >= Number(min_capacity));
  if (equipment) {
    const requiredEq = equipment.split(',').map(s => s.trim().toLowerCase());
    list = list.filter(r => requiredEq.every(eq => r.equipment?.map(x => x.toLowerCase()).includes(eq)));
  }
  res.json(list);
};

export const createRoom = async (req, res) => {
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

  try {
    if (isMongoConnected()) {
      const created = await Room.create(item);
      broadcastDataChange('rooms', { action: 'insert', item: created });
      return res.status(201).json(created);
    }
  } catch (e) {
    console.error('[Rooms POST Error]:', e);
  }

  const created = store.insert('rooms', item);
  res.status(201).json(created);
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const updated = await Room.findOneAndUpdate({ $or: [{ id }, { room_number: id }] }, req.body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Room not found' });
      broadcastDataChange('rooms', { action: 'update', item: updated });
      return res.json(updated);
    }
  } catch (e) {
    console.error('[Rooms PUT Error]:', e);
  }

  const updated = store.update('rooms', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Room not found' });
  res.json(updated);
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const deleted = await Room.findOneAndDelete({ $or: [{ id }, { room_number: id }] }).lean();
      if (!deleted) return res.status(404).json({ error: 'Room not found' });
      broadcastDataChange('rooms', { action: 'delete', id });
      return res.json({ message: 'Deleted successfully', item: deleted });
    }
  } catch (e) {
    console.error('[Rooms DELETE Error]:', e);
  }

  const deleted = store.delete('rooms', id);
  if (!deleted) return res.status(404).json({ error: 'Room not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};

// Extra Action: Book Room
export const bookRoom = async (req, res) => {
  const { id } = req.params;
  const { date, start_time, end_time, booked_by, purpose } = req.body;

  if (!date || !start_time || !end_time || !booked_by) {
    return res.status(400).json({ error: 'Missing required booking fields: date, start_time, end_time, booked_by' });
  }

  try {
    if (isMongoConnected()) {
      const room = await Room.findOne({ $or: [{ id }, { room_number: id }] });
      if (!room) return res.status(404).json({ error: 'Room not found' });

      const hasConflict = (room.bookings || []).some(b => {
        if (b.date !== date) return false;
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

      room.bookings.push(newBooking);
      await room.save();
      broadcastDataChange('rooms', { action: 'update', item: room });
      return res.status(201).json({ success: true, booking: newBooking, room });
    }
  } catch (e) {
    console.error('[Rooms Book Error]:', e);
  }

  // Fallback store
  const room = store.getById('rooms', id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const bookings = room.bookings || [];
  const hasConflict = bookings.some(b => {
    if (b.date !== date) return false;
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
export const cancelRoomBooking = async (req, res) => {
  const { id } = req.params;
  const { booking_id } = req.body;

  try {
    if (isMongoConnected()) {
      const room = await Room.findOne({ $or: [{ id }, { room_number: id }] });
      if (!room) return res.status(404).json({ error: 'Room not found' });

      const initialCount = (room.bookings || []).length;
      room.bookings = room.bookings.filter(b => b.booking_id !== booking_id);

      if (room.bookings.length === initialCount) {
        return res.status(404).json({ error: 'Booking ID not found' });
      }

      await room.save();
      broadcastDataChange('rooms', { action: 'update', item: room });
      return res.json({ success: true, message: 'Booking cancelled' });
    }
  } catch (e) {
    console.error('[Rooms Cancel Error]:', e);
  }

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
