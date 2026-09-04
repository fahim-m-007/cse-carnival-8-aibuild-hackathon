import { store, isMongoConnected, broadcastDataChange } from '../config/db.js';
import Schedule from '../models/Schedule.js';

export const getSchedules = async (req, res) => {
  const { day, course, room } = req.query;
  try {
    if (isMongoConnected()) {
      const filter = {};
      if (day) filter.day = new RegExp(`^${day}$`, 'i');
      if (course) filter.course = new RegExp(course, 'i');
      if (room) filter.room = new RegExp(room, 'i');
      const list = await Schedule.find(filter).lean();
      return res.json(list);
    }
  } catch (e) {
    console.error('[Schedules GET Error]:', e);
  }
  let list = store.getAll('schedules');
  if (day) list = list.filter(s => s.day.toLowerCase() === day.toLowerCase());
  if (course) list = list.filter(s => s.course.toLowerCase().includes(course.toLowerCase()));
  if (room) list = list.filter(s => s.room.toLowerCase().includes(room.toLowerCase()));
  res.json(list);
};

export const createSchedule = async (req, res) => {
  const item = {
    id: req.body.id || `sch-${Date.now().toString().slice(-5)}`,
    course: req.body.course,
    title: req.body.title,
    day: req.body.day || 'Sunday',
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    room: req.body.room,
    instructor: req.body.instructor || 'TBA',
    section: req.body.section || 'A'
  };

  try {
    if (isMongoConnected()) {
      const created = await Schedule.create(item);
      broadcastDataChange('schedules', { action: 'insert', item: created });
      return res.status(201).json(created);
    }
  } catch (e) {
    console.error('[Schedules POST Error]:', e);
  }

  const created = store.insert('schedules', item);
  res.status(201).json(created);
};

export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const updated = await Schedule.findOneAndUpdate({ id }, req.body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Schedule not found' });
      broadcastDataChange('schedules', { action: 'update', item: updated });
      return res.json(updated);
    }
  } catch (e) {
    console.error('[Schedules PUT Error]:', e);
  }

  const updated = store.update('schedules', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Schedule not found' });
  res.json(updated);
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const deleted = await Schedule.findOneAndDelete({ id }).lean();
      if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
      broadcastDataChange('schedules', { action: 'delete', id });
      return res.json({ message: 'Deleted successfully', item: deleted });
    }
  } catch (e) {
    console.error('[Schedules DELETE Error]:', e);
  }

  const deleted = store.delete('schedules', id);
  if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};
