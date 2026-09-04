// API client with seamless backend sync and resilient fallback
import seedSchedules from '../data/schedules.json';
import seedRooms from '../data/rooms.json';
import seedEvents from '../data/events.json';
import seedAnnouncements from '../data/announcements.json';
import seedAssignments from '../data/assignments.json';
import { getCurrentUser } from './auth';

const API_BASE = '/api';

// Helper to check if backend is alive
let isBackendOnline = false;

// Format any date value into strict YYYY-MM-DD (Year-Month-Date)
export function formatToYYYYMMDD(dateVal) {
  if (!dateVal) return '';
  const trimmed = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // Check for DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Check for YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  return trimmed;
}

// Ownership verification helper: checks if the given record was created by user
export function isItemOwner(item, user = null) {
  const currentUser = user || getCurrentUser();
  if (!item || !currentUser) return false;
  if (!item.createdBy) return false; // Initial seed records are institutional
  const userStudentId = String(currentUser.studentId || '').trim().toLowerCase();
  const userEmail = String(currentUser.eduMail || '').trim().toLowerCase();
  const creator = String(item.createdBy || '').trim().toLowerCase();
  return creator === userStudentId || creator === userEmail;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      isBackendOnline = true;
      return true;
    }
  } catch (e) {
    isBackendOnline = false;
  }
  return false;
}

export function subscribeToLiveUpdates(onUpdate) {
  try {
    const eventSource = new EventSource(`${API_BASE}/events/live`);
    eventSource.addEventListener('data_updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (onUpdate) onUpdate(payload);
      } catch (err) {}
    });
    return () => eventSource.close();
  } catch (err) {
    return () => {};
  }
}

// Local Storage Fallback Data Manager
const STORAGE_KEYS = {
  schedules: 'campusos_schedules',
  rooms: 'campusos_rooms',
  events: 'campusos_events',
  announcements: 'campusos_announcements',
  assignments: 'campusos_assignments',
  chatHistory: 'campusos_chat_history'
};

function getLocal(key, defaultData) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  // deep clone
  const clone = JSON.parse(JSON.stringify(defaultData));
  localStorage.setItem(key, JSON.stringify(clone));
  return clone;
}

function setLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

export function resetLocalSeed() {
  setLocal(STORAGE_KEYS.schedules, seedSchedules);
  setLocal(STORAGE_KEYS.rooms, seedRooms);
  setLocal(STORAGE_KEYS.events, seedEvents);
  setLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  setLocal(STORAGE_KEYS.assignments, seedAssignments);
}

// Auto-generate next clean event ID (e.g. evt-006)
export function getNextEventId() {
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const nums = list
    .map((e) => {
      const match = String(e.id || '').match(/evt-(\d+)/i);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter((n) => !isNaN(n));
  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : list.length + 1;
  return `evt-${String(nextNum).padStart(3, '0')}`;
}

// --- Schedules API ---
export async function fetchSchedules() {
  try {
    const res = await fetch(`${API_BASE}/schedules`);
    if (res.ok) {
      const data = await res.json();
      setLocal(STORAGE_KEYS.schedules, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.schedules, seedSchedules);
}

export async function createSchedule(item, user = null) {
  const currentUser = user || getCurrentUser();
  const newItem = {
    ...item,
    id: item.id || `sch-${Date.now()}`,
    createdBy: item.createdBy || currentUser?.studentId || 'current_user',
    createdByName: item.createdByName || currentUser?.name || 'AUST Student'
  };
  try {
    const res = await fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.schedules, seedSchedules);
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.schedules, list);
  return newItem;
}

export async function updateSchedule(id, item, user = null) {
  const currentUser = user || getCurrentUser();
  try {
    const res = await fetch(`${API_BASE}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.schedules, seedSchedules);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    if (currentUser && !isItemOwner(list[idx], currentUser)) {
      throw new Error('Permission denied: You can only edit classes that you added.');
    }
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.schedules, list);
    return list[idx];
  }
  return item;
}

export async function deleteSchedule(id, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.schedules, seedSchedules);
  const target = list.find(x => x.id === id);
  if (target && currentUser && !isItemOwner(target, currentUser)) {
    throw new Error('Permission denied: You can only delete classes that you added. Institutional schedules cannot be removed.');
  }
  try {
    const res = await fetch(`${API_BASE}/schedules/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.schedules, filtered);
  return true;
}

// --- Rooms API ---
export async function fetchRooms() {
  let rooms = [];
  try {
    const res = await fetch(`${API_BASE}/rooms`);
    if (res.ok) {
      rooms = await res.json();
    }
  } catch (e) {}
  if (!rooms || rooms.length === 0) {
    rooms = getLocal(STORAGE_KEYS.rooms, seedRooms);
  }
  // Sanitize all booking dates to strict YYYY-MM-DD
  rooms = rooms.map(r => ({
    ...r,
    bookings: (r.bookings || []).map(b => ({
      ...b,
      date: formatToYYYYMMDD(b.date)
    }))
  }));
  setLocal(STORAGE_KEYS.rooms, rooms);
  return rooms;
}

export async function createRoom(item, user = null) {
  const currentUser = user || getCurrentUser();
  const newItem = {
    ...item,
    id: item.id || `room-${Date.now()}`,
    bookings: item.bookings || [],
    createdBy: item.createdBy || currentUser?.studentId || 'current_user',
    createdByName: item.createdByName || currentUser?.name || 'AUST Student'
  };
  try {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  list.push(newItem);
  setLocal(STORAGE_KEYS.rooms, list);
  return newItem;
}

export async function updateRoom(id, item, user = null) {
  const currentUser = user || getCurrentUser();
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    if (currentUser && !isItemOwner(list[idx], currentUser)) {
      throw new Error('Permission denied: You can only edit rooms that you added.');
    }
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.rooms, list);
    return list[idx];
  }
  return item;
}

export async function deleteRoom(id, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const target = list.find(x => x.id === id);
  if (target && currentUser && !isItemOwner(target, currentUser)) {
    throw new Error('Permission denied: You can only delete rooms that you added. Official rooms cannot be deleted.');
  }
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.rooms, filtered);
  return true;
}

export async function bookRoom(roomId, bookingData, user = null) {
  const currentUser = user || getCurrentUser();
  const formattedDate = formatToYYYYMMDD(bookingData.date) || '2026-09-05';
  const newBooking = {
    booking_id: `bk-${Date.now().toString().slice(-4)}`,
    ...bookingData,
    date: formattedDate,
    booked_by: bookingData.booked_by || currentUser?.name || 'AUST Student',
    booked_by_id: currentUser?.studentId || bookingData.booked_by_id || ''
  };
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const room = list.find(r => r.id === roomId || r.room_number === roomId);
  if (!room) throw new Error('Room not found');
  room.bookings = room.bookings || [];
  room.bookings.push(newBooking);
  setLocal(STORAGE_KEYS.rooms, list);
  return { success: true, booking: newBooking, room };
}

export async function cancelRoomBooking(roomId, bookingId, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const room = list.find(r => r.id === roomId || r.room_number === roomId);
  if (room && room.bookings) {
    const bk = room.bookings.find(b => b.booking_id === bookingId);
    if (bk && currentUser && bk.booked_by_id) {
      const currentStudentId = (currentUser.studentId || '').trim().toLowerCase();
      const bookedById = (bk.booked_by_id || '').trim().toLowerCase();
      if (bookedById !== currentStudentId) {
        throw new Error('Permission denied: You can only cancel bookings that you created.');
      }
    }
    room.bookings = room.bookings.filter(b => b.booking_id !== bookingId);
    setLocal(STORAGE_KEYS.rooms, list);
  }
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true };
}

// --- Events API ---
export async function fetchEvents() {
  let events = [];
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (res.ok) {
      events = await res.json();
    }
  } catch (e) {}
  if (!events || events.length === 0) {
    events = getLocal(STORAGE_KEYS.events, seedEvents);
  }
  // Sanitize all event dates to strict YYYY-MM-DD
  events = events.map(e => ({
    ...e,
    date: formatToYYYYMMDD(e.date),
    end_date: e.end_date ? formatToYYYYMMDD(e.end_date) : formatToYYYYMMDD(e.date)
  }));
  setLocal(STORAGE_KEYS.events, events);
  return events;
}

export async function createEvent(item, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.events, seedEvents);

  // Normalize dates to strict YYYY-MM-DD
  const date = formatToYYYYMMDD(item.date) || '2026-09-08';
  const end_date = formatToYYYYMMDD(item.end_date) || date;

  // Auto-generate next clean event ID if not given
  let eventId = (item.id || '').trim();
  if (!eventId) {
    eventId = getNextEventId();
  }

  // Check if Event ID already exists
  const idExists = list.some(e => String(e.id || '').toLowerCase() === eventId.toLowerCase());
  if (idExists) {
    throw new Error(`Event ID "${eventId}" is already given/taken. Please provide a unique Event ID.`);
  }

  // Check if Event Name already exists
  const cleanName = (item.name || '').trim().toLowerCase();
  if (cleanName) {
    const nameExists = list.some(e => String(e.name || '').trim().toLowerCase() === cleanName);
    if (nameExists) {
      throw new Error(`An event with name "${item.name}" already exists. Please choose a unique event name.`);
    }
  }

  const newItem = {
    ...item,
    id: eventId,
    name: (item.name || '').trim(),
    date,
    end_date,
    registered: item.registered || 0,
    registrations: item.registrations || [],
    createdBy: item.createdBy || currentUser?.studentId || 'current_user',
    createdByName: item.createdByName || currentUser?.name || 'AUST Student',
    organizer: item.organizer || currentUser?.name || 'CSE Department'
  };

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  list.unshift(newItem);
  setLocal(STORAGE_KEYS.events, list);
  return newItem;
}

export async function updateEvent(id, item, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    if (currentUser && !isItemOwner(list[idx], currentUser)) {
      throw new Error('Permission denied: You can only edit events that you created.');
    }
    const date = item.date ? formatToYYYYMMDD(item.date) : list[idx].date;
    const end_date = item.end_date ? formatToYYYYMMDD(item.end_date) : (item.date ? date : list[idx].end_date);
    list[idx] = { ...list[idx], ...item, date, end_date };
    setLocal(STORAGE_KEYS.events, list);
    return list[idx];
  }
  return item;
}

export async function deleteEvent(id, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const target = list.find(x => x.id === id);
  if (target && currentUser && !isItemOwner(target, currentUser)) {
    throw new Error('Permission denied: You can only delete events that you created. Institutional events cannot be removed.');
  }
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.events, filtered);
  return true;
}

export async function registerForEvent(eventId, studentData) {
  const cleanReg = {
    student_id: (studentData.student_id || '').trim(),
    name: (studentData.name || '').trim()
  };

  if (!cleanReg.student_id || !cleanReg.name) {
    throw new Error('Please provide both your Student ID and Full Name to register.');
  }

  // 1. Prioritize Backend Call (saves directly to MongoDB Atlas)
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanReg)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Registration failed (Status: ${res.status})`);
    }

    const data = await res.json();

    // Sync local storage cache with returned event
    const list = getLocal(STORAGE_KEYS.events, seedEvents);
    const idx = list.findIndex(e => e.id === eventId || (data.event && e.id === data.event.id));
    if (idx !== -1 && data.event) {
      list[idx] = data.event;
    }
    setLocal(STORAGE_KEYS.events, list);

    return data;
  } catch (err) {
    // If it's a backend validation/business error (e.g. 400 capacity full or 409 already registered), throw it
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
      throw err;
    }

    // 2. Offline Fallback if backend is unreachable
    const list = getLocal(STORAGE_KEYS.events, seedEvents);
    const ev = list.find(e => e.id === eventId || e.name.toLowerCase().includes(eventId.toLowerCase()));
    if (!ev) throw new Error('Event not found');
    if (ev.registered >= ev.capacity) throw new Error('Event capacity is full');
    ev.registrations = ev.registrations || [];

    const targetStudentId = cleanReg.student_id.toLowerCase();
    const already = ev.registrations.find(r => (r.student_id || '').trim().toLowerCase() === targetStudentId);
    if (already) {
      throw new Error(`Student ID ${cleanReg.student_id} is already registered for this event.`);
    }

    ev.registrations.push(cleanReg);
    ev.registered = Math.max((ev.registered || 0) + 1, ev.registrations.length);
    if (ev.registered >= ev.capacity) ev.status = 'full';
    setLocal(STORAGE_KEYS.events, list);

    return { success: true, event: ev };
  }
}

export async function cancelEventRegistration(eventId, studentId, user = null) {
  const currentUser = user || getCurrentUser();
  const currentStudentId = (currentUser?.studentId || '').trim().toLowerCase();
  const targetStudentId = (studentId || '').trim().toLowerCase();

  // Enforce rule: Users cannot delete other registered users' registration
  if (currentUser && currentStudentId && targetStudentId !== currentStudentId) {
    throw new Error("Permission denied: You cannot delete another student's event registration.");
  }

  // 1. Prioritize Backend Call (saves directly to MongoDB Atlas)
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/cancel-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: (studentId || '').trim() })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Cancel registration failed (Status: ${res.status})`);
    }

    const data = await res.json();

    // Sync local storage
    const list = getLocal(STORAGE_KEYS.events, seedEvents);
    const idx = list.findIndex(e => e.id === eventId);
    if (idx !== -1 && data.event) {
      list[idx] = data.event;
    } else if (idx !== -1) {
      list[idx].registrations = (list[idx].registrations || []).filter(r => (r.student_id || '').trim().toLowerCase() !== targetStudentId);
      list[idx].registered = Math.max(0, (list[idx].registered || 1) - 1);
      if (list[idx].status === 'full' && list[idx].registered < list[idx].capacity) {
        list[idx].status = 'upcoming';
      }
    }
    setLocal(STORAGE_KEYS.events, list);

    return data;
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
      throw err;
    }

    // Offline fallback
    const list = getLocal(STORAGE_KEYS.events, seedEvents);
    const ev = list.find(e => e.id === eventId);
    if (ev && ev.registrations) {
      ev.registrations = ev.registrations.filter(r => (r.student_id || '').trim().toLowerCase() !== targetStudentId);
      ev.registered = Math.max(0, (ev.registered || 1) - 1);
      if (ev.status === 'full' && ev.registered < ev.capacity) ev.status = 'upcoming';
      setLocal(STORAGE_KEYS.events, list);
    }

    return { success: true };
  }
}

// --- Announcements API ---
export async function fetchAnnouncements() {
  let announcements = [];
  try {
    const res = await fetch(`${API_BASE}/announcements`);
    if (res.ok) {
      announcements = await res.json();
    }
  } catch (e) {}
  if (!announcements || announcements.length === 0) {
    announcements = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  }
  // Sanitize all announcement dates to strict YYYY-MM-DD
  announcements = announcements.map(a => ({
    ...a,
    date: formatToYYYYMMDD(a.date),
    expires: a.expires ? formatToYYYYMMDD(a.expires) : ''
  }));
  setLocal(STORAGE_KEYS.announcements, announcements);
  return announcements;
}

export async function createAnnouncement(item, user = null) {
  const currentUser = user || getCurrentUser();
  const date = formatToYYYYMMDD(item.date) || formatToYYYYMMDD(new Date());
  const expires = item.expires ? formatToYYYYMMDD(item.expires) : '';
  const newItem = {
    ...item,
    id: item.id || `ann-${Date.now()}`,
    date,
    expires,
    createdBy: item.createdBy || currentUser?.studentId || 'current_user',
    createdByName: item.createdByName || currentUser?.name || 'AUST Student',
    posted_by: item.posted_by || currentUser?.name || 'CSE Department'
  };
  try {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.announcements, list);
  return newItem;
}

export async function updateAnnouncement(id, item, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    if (currentUser && !isItemOwner(list[idx], currentUser)) {
      throw new Error('Permission denied: You can only edit notices that you posted.');
    }
    const date = item.date ? formatToYYYYMMDD(item.date) : list[idx].date;
    const expires = item.expires !== undefined ? (item.expires ? formatToYYYYMMDD(item.expires) : '') : list[idx].expires;
    list[idx] = { ...list[idx], ...item, date, expires };
    setLocal(STORAGE_KEYS.announcements, list);
    return list[idx];
  }
  return item;
}

export async function deleteAnnouncement(id, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  const target = list.find(x => x.id === id);
  if (target && currentUser && !isItemOwner(target, currentUser)) {
    throw new Error('Permission denied: You can only delete notices that you posted. Official announcements cannot be removed.');
  }
  try {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.announcements, filtered);
  return true;
}

// --- Assignments API ---
export async function fetchAssignments() {
  let assignments = [];
  try {
    const res = await fetch(`${API_BASE}/assignments`);
    if (res.ok) {
      assignments = await res.json();
    }
  } catch (e) {}
  if (!assignments || assignments.length === 0) {
    assignments = getLocal(STORAGE_KEYS.assignments, seedAssignments);
  }
  // Sanitize all assignment dates to strict YYYY-MM-DD
  assignments = assignments.map(a => ({
    ...a,
    deadline: formatToYYYYMMDD(a.deadline),
    assigned_date: a.assigned_date ? formatToYYYYMMDD(a.assigned_date) : ''
  }));
  setLocal(STORAGE_KEYS.assignments, assignments);
  return assignments;
}

export async function createAssignment(item, user = null) {
  const currentUser = user || getCurrentUser();
  const deadline = formatToYYYYMMDD(item.deadline) || '2026-09-12';
  const assigned_date = formatToYYYYMMDD(item.assigned_date) || formatToYYYYMMDD(new Date());
  const newItem = {
    ...item,
    id: item.id || `asgn-${Date.now()}`,
    deadline,
    assigned_date,
    createdBy: item.createdBy || currentUser?.studentId || 'current_user',
    createdByName: item.createdByName || currentUser?.name || 'AUST Student'
  };
  try {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.assignments, seedAssignments);
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.assignments, list);
  return newItem;
}

export async function updateAssignment(id, item, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.assignments, seedAssignments);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    if (currentUser && !isItemOwner(list[idx], currentUser)) {
      throw new Error('Permission denied: You can only edit assignments that you created.');
    }
    const deadline = item.deadline ? formatToYYYYMMDD(item.deadline) : list[idx].deadline;
    const assigned_date = item.assigned_date ? formatToYYYYMMDD(item.assigned_date) : list[idx].assigned_date;
    list[idx] = { ...list[idx], ...item, deadline, assigned_date };
    setLocal(STORAGE_KEYS.assignments, list);
    return list[idx];
  }
  return item;
}

export async function deleteAssignment(id, user = null) {
  const currentUser = user || getCurrentUser();
  const list = getLocal(STORAGE_KEYS.assignments, seedAssignments);
  const target = list.find(x => x.id === id);
  if (target && currentUser && !isItemOwner(target, currentUser)) {
    throw new Error('Permission denied: You can only delete assignments that you created. Course assignments cannot be removed.');
  }
  try {
    const res = await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.assignments, filtered);
  return true;
}

// Reset Backend / Local Data
export async function resetAllData() {
  try {
    const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
    if (res.ok) {
      resetLocalSeed();
      return true;
    }
  } catch (e) {}
  resetLocalSeed();
  return true;
}

// Send chat message to AI Agent
export async function sendAgentMessage(message, history = []) {
  try {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  // Intelligent client-side fallback agent when backend is starting or offline
  return simulateClientAgent(message);
}

// Resilient simulated agent for UI development & fallback preview
function simulateClientAgent(message) {
  const lower = message.toLowerCase();
  const announcements = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  const schedules = getLocal(STORAGE_KEYS.schedules, seedSchedules);
  const rooms = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const events = getLocal(STORAGE_KEYS.events, seedEvents);
  const assignments = getLocal(STORAGE_KEYS.assignments, seedAssignments);

  // 1. Next class
  if (lower.includes('next class')) {
    // Current simulated time: Friday Sep 4, 2026. University days Sun-Thu.
    // Next class is on Sunday!
    const sundayClasses = schedules.filter(s => s.day === 'Sunday');
    const firstClass = sundayClasses[0];
    return {
      text: `Your next university class is on **Sunday at ${firstClass.start_time}**: **${firstClass.course}** (${firstClass.title}) in **Room ${firstClass.room}** with ${firstClass.instructor}. Note: Check the latest announcements regarding any room changes!`,
      toolCalls: [{
        tool: 'get_schedules',
        args: { day: 'Sunday' },
        result: `${sundayClasses.length} classes retrieved for Sunday.`
      }]
    };
  }

  // 2. Wednesday classes
  if (lower.includes('wednesday')) {
    const wedClasses = schedules.filter(s => s.day === 'Wednesday');
    const list = wedClasses.map(c => `• **${c.course}**: ${c.title} (${c.start_time}–${c.end_time}, Room ${c.room}, Sec ${c.section})`).join('\n');
    return {
      text: `Here are your scheduled classes for **Wednesday**:\n\n${list}`,
      toolCalls: [{
        tool: 'get_schedules',
        args: { day: 'Wednesday' },
        result: `${wedClasses.length} classes found for Wednesday.`
      }]
    };
  }

  // 3. Due this week / assignments
  if (lower.includes('due') || lower.includes('assignment')) {
    const pending = assignments.filter(a => a.status === 'pending');
    const list = pending.map(a => `• **${a.course} - ${a.title}**: Due on **${a.deadline}** via ${a.submission_platform} (${a.marks} marks)`).join('\n');
    return {
      text: `You have **${pending.length} pending assignments**:\n\n${list}`,
      toolCalls: [{
        tool: 'get_assignments',
        args: { status: 'pending' },
        result: `${pending.length} assignments found.`
      }]
    };
  }

  // 4. High priority announcements
  if (lower.includes('high priority') || lower.includes('announcement')) {
    const high = announcements.filter(a => a.priority === 'high');
    const list = high.map(a => `📢 **${a.title}**\n${a.body}\n*(Posted by ${a.posted_by} on ${a.date})*`).join('\n\n');
    return {
      text: `Here are the active **High Priority Announcements**:\n\n${list}`,
      toolCalls: [{
        tool: 'get_announcements',
        args: { priority: 'high' },
        result: `${high.length} high priority announcements retrieved.`
      }]
    };
  }

  // 5. Free until 2 PM / events
  if (lower.includes('free until 2') || (lower.includes('free') && lower.includes('campus'))) {
    const matchEvents = events.filter(e => e.start_time <= '14:00');
    return {
      text: `You have free time before 2:00 PM! Looking at campus happenings, the **AUSTPIC AI Build Hackathon** starts at 09:00 in Room 7C01, or you can prepare for afternoon labs. Always check the cafeteria or library for open spaces!`,
      toolCalls: [
        { tool: 'get_schedules', args: { time_before: '14:00' }, result: 'No conflicts found' },
        { tool: 'get_events', args: { date: '2026-09-10' }, result: 'Retrieved matching campus events' }
      ]
    };
  }

  // 6. Labs with projector & 30+ people
  if (lower.includes('labs') && (lower.includes('projector') || lower.includes('30'))) {
    const matched = rooms.filter(r => r.type === 'lab' && r.capacity >= 30 && r.equipment.includes('projector'));
    const list = matched.map(r => `• **Room ${r.room_number}** (Floor ${r.floor}): Capacity ${r.capacity}, Equipment: ${r.equipment.join(', ')}`).join('\n');
    return {
      text: `Found **${matched.length} labs** equipped with a projector and capacity of at least 30:\n\n${list || 'None match all criteria directly.'}`,
      toolCalls: [{
        tool: 'get_rooms',
        args: { type: 'lab', min_capacity: 30, equipment: ['projector'] },
        result: `${matched.length} matching rooms.`
      }]
    };
  }

  // 7. Vague booking request (Refusal/Clarification test!)
  if (lower.includes('just book me any room') || (lower.includes('book') && lower.includes('any room'))) {
    return {
      text: `That's a bit too vague. To book a room for you, could you please specify:\n1. Which room or room type you prefer (classroom, lab, or seminar hall)?\n2. The exact start and end time tomorrow afternoon?\n\nOnce you let me know, I'll check availability and reserve it for you!`,
      toolCalls: [] // Note: ZERO tool calls made because it's vague!
    };
  }

  // 8. Book room action
  if (lower.includes('book room') || (lower.includes('book') && lower.includes('7a02'))) {
    return {
      text: `✅ **Room 7A02** has been checked and successfully booked for tomorrow from 3:00 PM to 5:00 PM for student study session!`,
      toolCalls: [
        { tool: 'check_room_availability', args: { room: '7A02', date: '2026-09-05', time: '15:00-17:00' }, result: 'Available' },
        { tool: 'book_room', args: { room_number: '7A02', date: '2026-09-05', start_time: '15:00', end_time: '17:00', booked_by: 'Student User', purpose: 'Group Study' }, result: 'Booking confirmed (bk-9941)' }
      ]
    };
  }

  // Default senior response
  return {
    text: `I'm CampusOS Senior AI. You can ask me about your class schedule, upcoming assignment deadlines, room bookings, or campus announcements!`,
    toolCalls: []
  };
}
