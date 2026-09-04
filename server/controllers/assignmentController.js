import { store, isMongoConnected, broadcastDataChange } from '../config/db.js';
import Assignment from '../models/Assignment.js';

export const getAssignments = async (req, res) => {
  const { status, course } = req.query;
  try {
    if (isMongoConnected()) {
      const filter = {};
      if (status) filter.status = status.toLowerCase();
      if (course) filter.course = new RegExp(course, 'i');
      const list = await Assignment.find(filter).lean();
      return res.json(list);
    }
  } catch (e) {
    console.error('[Assignments GET Error]:', e);
  }

  let list = store.getAll('assignments');
  if (status) list = list.filter(a => a.status.toLowerCase() === status.toLowerCase());
  if (course) list = list.filter(a => a.course.toLowerCase().includes(course.toLowerCase()));
  res.json(list);
};

export const createAssignment = async (req, res) => {
  const item = {
    id: req.body.id || `asgn-${Date.now().toString().slice(-4)}`,
    course: req.body.course,
    course_title: req.body.course_title || '',
    title: req.body.title,
    description: req.body.description || '',
    assigned_date: req.body.assigned_date || new Date().toISOString().split('T')[0],
    deadline: req.body.deadline,
    submission_platform: req.body.submission_platform || 'Google Classroom',
    status: req.body.status || 'pending',
    marks: Number(req.body.marks) || 10
  };

  try {
    if (isMongoConnected()) {
      const created = await Assignment.create(item);
      broadcastDataChange('assignments', { action: 'insert', item: created });
      return res.status(201).json(created);
    }
  } catch (e) {
    console.error('[Assignments POST Error]:', e);
  }

  const created = store.insert('assignments', item);
  res.status(201).json(created);
};

export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const updated = await Assignment.findOneAndUpdate({ id }, req.body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Assignment not found' });
      broadcastDataChange('assignments', { action: 'update', item: updated });
      return res.json(updated);
    }
  } catch (e) {
    console.error('[Assignments PUT Error]:', e);
  }

  const updated = store.update('assignments', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Assignment not found' });
  res.json(updated);
};

export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const deleted = await Assignment.findOneAndDelete({ id }).lean();
      if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
      broadcastDataChange('assignments', { action: 'delete', id });
      return res.json({ message: 'Deleted successfully', item: deleted });
    }
  } catch (e) {
    console.error('[Assignments DELETE Error]:', e);
  }

  const deleted = store.delete('assignments', id);
  if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};
