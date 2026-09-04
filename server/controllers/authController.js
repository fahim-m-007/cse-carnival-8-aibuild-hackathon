import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';

// Fallback in-memory users if Mongo isn't active
const inMemoryUsers = [
  {
    eduMail: 'student@aust.edu',
    studentId: '20210104050',
    dept: 'CSE',
    name: 'AUST Student',
    password: 'password123'
  },
  {
    eduMail: 'fahim.cse@aust.edu',
    studentId: '20210104007',
    dept: 'CSE',
    name: 'Fahim Morshed',
    password: 'password123'
  }
];

export async function register(req, res) {
  const { eduMail, studentId, dept, name, password } = req.body;

  if (!eduMail || !studentId || !dept || !name || !password) {
    return res.status(400).json({ error: 'All fields are required: eduMail, studentId, dept, name, password' });
  }

  const normalizedEmail = eduMail.toLowerCase().trim();
  const normalizedId = studentId.trim();

  try {
    if (isMongoConnected()) {
      const existing = await User.findOne({
        $or: [{ eduMail: normalizedEmail }, { studentId: normalizedId }]
      });

      if (existing) {
        if (existing.eduMail === normalizedEmail) {
          return res.status(409).json({ error: 'An account with this institutional edu mail already exists.' });
        }
        return res.status(409).json({ error: 'This Student ID is already registered.' });
      }

      const user = await User.create({
        eduMail: normalizedEmail,
        studentId: normalizedId,
        dept,
        name,
        password
      });

      return res.status(201).json({
        success: true,
        user: {
          eduMail: user.eduMail,
          studentId: user.studentId,
          dept: user.dept,
          name: user.name
        }
      });
    } else {
      // In-Memory fallback
      const exists = inMemoryUsers.some(u => u.eduMail === normalizedEmail || u.studentId === normalizedId);
      if (exists) {
        return res.status(409).json({ error: 'Account or Student ID already exists.' });
      }
      const user = { eduMail: normalizedEmail, studentId: normalizedId, dept, name, password };
      inMemoryUsers.push(user);
      return res.status(201).json({
        success: true,
        user: { eduMail: user.eduMail, studentId: user.studentId, dept: user.dept, name: user.name }
      });
    }
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
}

export async function login(req, res) {
  const { eduMail, password } = req.body;

  if (!eduMail || !password) {
    return res.status(400).json({ error: 'Please enter both edu email and password' });
  }

  const normalizedEmail = eduMail.toLowerCase().trim();

  try {
    if (isMongoConnected()) {
      const user = await User.findOne({ eduMail: normalizedEmail });
      if (!user || user.password !== password.trim()) {
        return res.status(401).json({ error: 'Invalid institutional email or password.' });
      }

      return res.json({
        success: true,
        user: {
          eduMail: user.eduMail,
          studentId: user.studentId,
          dept: user.dept,
          name: user.name
        }
      });
    } else {
      // In-Memory fallback
      const user = inMemoryUsers.find(u => u.eduMail === normalizedEmail);
      if (!user || user.password !== password.trim()) {
        return res.status(401).json({ error: 'Invalid institutional email or password.' });
      }
      return res.json({
        success: true,
        user: {
          eduMail: user.eduMail,
          studentId: user.studentId,
          dept: user.dept,
          name: user.name
        }
      });
    }
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
}
