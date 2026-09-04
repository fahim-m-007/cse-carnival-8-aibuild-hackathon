import express from 'express';
import {
  getSchedules, createSchedule, updateSchedule, deleteSchedule
} from '../controllers/scheduleController.js';
import {
  getRooms, createRoom, updateRoom, deleteRoom, bookRoom, cancelRoomBooking
} from '../controllers/roomController.js';
import {
  getEvents, createEvent, updateEvent, deleteEvent, registerForEvent, cancelEventRegistration
} from '../controllers/eventController.js';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement
} from '../controllers/announcementController.js';
import {
  getAssignments, createAssignment, updateAssignment, deleteAssignment
} from '../controllers/assignmentController.js';
import { resetSeedData } from '../controllers/seedController.js';
import { registerSSEClient } from '../config/db.js';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// Authentication Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SSE Live Updates Stream
router.get('/events/live', (req, res) => registerSSEClient(res));

// Seed Reset
router.post('/seed/reset', resetSeedData);

// 1. Schedules
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.put('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

// 2. Rooms
router.get('/rooms', getRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);
router.post('/rooms/:id/book', bookRoom);
router.post('/rooms/:id/cancel-booking', cancelRoomBooking);

// 3. Events
router.get('/events', getEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.post('/events/:id/register', registerForEvent);
router.post('/events/:id/cancel-registration', cancelEventRegistration);

// 4. Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// 5. Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

export default router;
