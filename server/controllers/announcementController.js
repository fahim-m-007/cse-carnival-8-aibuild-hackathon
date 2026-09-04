import { store, isMongoConnected, broadcastDataChange } from '../config/db.js';
import Announcement from '../models/Announcement.js';

export const getAnnouncements = async (req, res) => {
  const { priority } = req.query;
  try {
    if (isMongoConnected()) {
      const filter = {};
      if (priority) filter.priority = priority.toLowerCase();
      const list = await Announcement.find(filter).lean();
      return res.json(list);
    }
  } catch (e) {
    console.error('[Announcements GET Error]:', e);
  }

  let list = store.getAll('announcements');
  if (priority) list = list.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
  res.json(list);
};

export const createAnnouncement = async (req, res) => {
  const item = {
    id: req.body.id || `ann-${Date.now().toString().slice(-4)}`,
    title: req.body.title,
    body: req.body.body,
    date: req.body.date || new Date().toISOString().split('T')[0],
    priority: req.body.priority || 'medium',
    posted_by: req.body.posted_by || 'Administration',
    expires: req.body.expires || ''
  };

  try {
    if (isMongoConnected()) {
      const created = await Announcement.create(item);
      broadcastDataChange('announcements', { action: 'insert', item: created });
      return res.status(201).json(created);
    }
  } catch (e) {
    console.error('[Announcements POST Error]:', e);
  }

  const created = store.insert('announcements', item);
  res.status(201).json(created);
};

export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const updated = await Announcement.findOneAndUpdate({ id }, req.body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Announcement not found' });
      broadcastDataChange('announcements', { action: 'update', item: updated });
      return res.json(updated);
    }
  } catch (e) {
    console.error('[Announcements PUT Error]:', e);
  }

  const updated = store.update('announcements', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Announcement not found' });
  res.json(updated);
};

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const deleted = await Announcement.findOneAndDelete({ id }).lean();
      if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
      broadcastDataChange('announcements', { action: 'delete', id });
      return res.json({ message: 'Deleted successfully', item: deleted });
    }
  } catch (e) {
    console.error('[Announcements DELETE Error]:', e);
  }

  const deleted = store.delete('announcements', id);
  if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ message: 'Deleted successfully', item: deleted });
};
