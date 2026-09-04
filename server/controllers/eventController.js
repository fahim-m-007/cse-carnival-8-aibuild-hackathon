import { store, isMongoConnected, broadcastDataChange } from '../config/db.js';
import Event from '../models/Event.js';

export const getEvents = async (req, res) => {
  const { status, date } = req.query;
  try {
    if (isMongoConnected()) {
      const filter = {};
      if (status) filter.status = status.toLowerCase();
      if (date) filter.date = date;
      const list = await Event.find(filter).lean();
      return res.json(list);
    }
  } catch (e) {
    console.error('[Events GET Error]:', e);
  }

  let list = store.getAll('events');
  if (status) list = list.filter(e => e.status.toLowerCase() === status.toLowerCase());
  if (date) list = list.filter(e => e.date === date);
  res.json(list);
};

export const createEvent = async (req, res) => {
  const item = {
    id: req.body.id || `evt-${Date.now().toString().slice(-4)}`,
    name: req.body.name,
    description: req.body.description,
    date: req.body.date,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    end_date: req.body.end_date || req.body.date,
    venue: req.body.venue,
    organizer: req.body.organizer || 'Campus',
    capacity: Number(req.body.capacity) || 50,
    registered: Number(req.body.registered) || 0,
    registrations: req.body.registrations || [],
    status: req.body.status || 'upcoming'
  };

  try {
    if (isMongoConnected()) {
      const created = await Event.create(item);
      broadcastDataChange('events', { action: 'insert', item: created });
      return res.status(201).json(created);
    }
  } catch (e) {
    console.error('[Events POST Error]:', e);
  }

  const created = store.insert('events', item);
  res.status(201).json(created);
};

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const updated = await Event.findOneAndUpdate({ id }, req.body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Event not found' });
      broadcastDataChange('events', { action: 'update', item: updated });
      return res.json(updated);
    }
  } catch (e) {
    console.error('[Events PUT Error]:', e);
  }

  const updated = store.update('events', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Event not found' });
  res.json(updated);
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const deleted = await Event.findOneAndDelete({ id }).lean();
      if (!deleted) return res.status(404).json({ error: 'Event not found' });
      broadcastDataChange('events', { action: 'delete', id });
      return res.json({ message: 'Deleted successfully', item: deleted });
    }
  } catch (e) {
    console.error('[Events DELETE Error]:', e);
  }

  const deleted = store.delete('events', id);
  if (!deleted) return res.status(404).json({ error: 'Event not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};

// Extra Action: Register for Event
export const registerForEvent = async (req, res) => {
  const { id } = req.params;
  const { student_id, name } = req.body;

  if (!student_id || !name) {
    return res.status(400).json({ error: 'Missing required fields: student_id, name' });
  }

  try {
    if (isMongoConnected()) {
      const event = await Event.findOne({ $or: [{ id }, { name: new RegExp(id, 'i') }] });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      event.registrations = event.registrations || [];
      if (event.registrations.length >= event.capacity) {
        event.status = 'full';
        await event.save();
        return res.status(400).json({ error: 'Event has reached maximum capacity.' });
      }

      const alreadyRegistered = event.registrations.find(r => r.student_id === student_id);
      if (alreadyRegistered) {
        return res.status(409).json({ error: `Student ${student_id} is already registered.` });
      }

      event.registrations.push({ student_id, name });
      event.registered = event.registrations.length;
      if (event.registered >= event.capacity) {
        event.status = 'full';
      }

      await event.save();
      broadcastDataChange('events', { action: 'update', item: event });
      return res.status(201).json({ success: true, event });
    }
  } catch (e) {
    console.error('[Events Register Error]:', e);
  }

  const event = store.getById('events', id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  event.registrations = event.registrations || [];
  if (event.registrations.length >= event.capacity) {
    event.status = 'full';
    store.update('events', event.id, { status: 'full' });
    return res.status(400).json({ error: 'Event has reached maximum capacity.' });
  }

  const alreadyRegistered = event.registrations.find(r => r.student_id === student_id);
  if (alreadyRegistered) {
    return res.status(409).json({ error: `Student ${student_id} is already registered.` });
  }

  event.registrations.push({ student_id, name });
  event.registered = event.registrations.length;
  if (event.registered >= event.capacity) {
    event.status = 'full';
  }

  store.update('events', event.id, {
    registrations: event.registrations,
    registered: event.registered,
    status: event.status
  });

  res.status(201).json({ success: true, event });
};

// Extra Action: Cancel Event Registration
export const cancelEventRegistration = async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  try {
    if (isMongoConnected()) {
      const event = await Event.findOne({ $or: [{ id }, { name: new RegExp(id, 'i') }] });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const initialCount = (event.registrations || []).length;
      event.registrations = (event.registrations || []).filter(r => r.student_id !== student_id);

      if (event.registrations.length === initialCount) {
        return res.status(404).json({ error: 'Student registration not found' });
      }

      event.registered = event.registrations.length;
      if (event.status === 'full' && event.registered < event.capacity) {
        event.status = 'upcoming';
      }

      await event.save();
      broadcastDataChange('events', { action: 'update', item: event });
      return res.json({ success: true, message: 'Registration cancelled' });
    }
  } catch (e) {
    console.error('[Events Cancel Error]:', e);
  }

  const event = store.getById('events', id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const initialCount = (event.registrations || []).length;
  event.registrations = (event.registrations || []).filter(r => r.student_id !== student_id);

  if (event.registrations.length === initialCount) {
    return res.status(404).json({ error: 'Student registration not found' });
  }

  event.registered = event.registrations.length;
  if (event.status === 'full' && event.registered < event.capacity) {
    event.status = 'upcoming';
  }

  store.update('events', event.id, {
    registrations: event.registrations,
    registered: event.registered,
    status: event.status
  });

  res.json({ success: true, message: 'Registration cancelled' });
};
