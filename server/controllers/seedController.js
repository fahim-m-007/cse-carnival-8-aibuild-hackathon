import { store } from '../config/db.js';

export const resetSeedData = (req, res) => {
  try {
    store.resetAll();
    res.json({ success: true, message: 'All 5 collections restored to original seed data.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset seed data', details: err.message });
  }
};
