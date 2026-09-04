import { store } from '../config/db.js';

export const getAssignments = (req, res) => {
  const { status, course } = req.query;
  let list = store.getAll('assignments');
  if (status) list = list.filter(a => a.status.toLowerCase() === status.toLowerCase());
  if (course) list = list.filter(a => a.course.toLowerCase().includes(course.toLowerCase()));
  res.json(list);
};

export const createAssignment = (req, res) => {
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
  const created = store.insert('assignments', item);
  res.status(201).json(created);
};

export const updateAssignment = (req, res) => {
  const { id } = req.params;
  const updated = store.update('assignments', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Assignment not found' });
  res.json(updated);
};

export const deleteAssignment = (req, res) => {
  const { id } = req.params;
  const deleted = store.delete('assignments', id);
  if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};
