import { store } from '../config/db.js';

export const getAnnouncements = (req, res) => {
  const { priority } = req.query;
  let list = store.getAll('announcements');
  if (priority) list = list.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
  res.json(list);
};

export const createAnnouncement = (req, res) => {
  const item = {
    id: req.body.id || `ann-${Date.now().toString().slice(-4)}`,
    title: req.body.title,
    body: req.body.body,
    date: req.body.date || new Date().toISOString().split('T')[0],
    priority: req.body.priority || 'medium',
    posted_by: req.body.posted_by || 'Administration',
    expires: req.body.expires || ''
  };
  const created = store.insert('announcements', item);
  res.status(201).json(created);
};

export const updateAnnouncement = (req, res) => {
  const { id } = req.params;
  const updated = store.update('announcements', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Announcement not found' });
  res.json(updated);
};

export const deleteAnnouncement = (req, res) => {
  const { id } = req.params;
  const deleted = store.delete('announcements', id);
  if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};
