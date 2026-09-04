import { store } from '../config/db.js';

export const getSchedules = (req, res) => {
  const { day, course, room } = req.query;
  let list = store.getAll('schedules');
  if (day) list = list.filter(s => s.day.toLowerCase() === day.toLowerCase());
  if (course) list = list.filter(s => s.course.toLowerCase().includes(course.toLowerCase()));
  if (room) list = list.filter(s => s.room.toLowerCase().includes(room.toLowerCase()));
  res.json(list);
};

export const createSchedule = (req, res) => {
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
  const created = store.insert('schedules', item);
  res.status(201).json(created);
};

export const updateSchedule = (req, res) => {
  const { id } = req.params;
  const updated = store.update('schedules', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Schedule not found' });
  res.json(updated);
};

export const deleteSchedule = (req, res) => {
  const { id } = req.params;
  const deleted = store.delete('schedules', id);
  if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};
