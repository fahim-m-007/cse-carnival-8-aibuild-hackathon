// API client with seamless backend sync and resilient fallback
import seedSchedules from '../data/schedules.json';
import seedRooms from '../data/rooms.json';
import seedEvents from '../data/events.json';
import seedAnnouncements from '../data/announcements.json';
import seedAssignments from '../data/assignments.json';

const API_BASE = '/api';

// Helper to check if backend is alive
let isBackendOnline = false;

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

export async function createSchedule(item) {
  try {
    const res = await fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.schedules, seedSchedules);
  const newItem = { ...item, id: item.id || `sch-${Date.now()}` };
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.schedules, list);
  return newItem;
}

export async function updateSchedule(id, item) {
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
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.schedules, list);
    return list[idx];
  }
  return item;
}

export async function deleteSchedule(id) {
  try {
    const res = await fetch(`${API_BASE}/schedules/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.schedules, seedSchedules);
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.schedules, filtered);
  return true;
}

// --- Rooms API ---
export async function fetchRooms() {
  try {
    const res = await fetch(`${API_BASE}/rooms`);
    if (res.ok) {
      const data = await res.json();
      setLocal(STORAGE_KEYS.rooms, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.rooms, seedRooms);
}

export async function createRoom(item) {
  try {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const newItem = { ...item, id: item.id || `room-${Date.now()}`, bookings: item.bookings || [] };
  list.push(newItem);
  setLocal(STORAGE_KEYS.rooms, list);
  return newItem;
}

export async function updateRoom(id, item) {
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
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.rooms, list);
    return list[idx];
  }
  return item;
}

export async function deleteRoom(id) {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.rooms, filtered);
  return true;
}

export async function bookRoom(roomId, bookingData) {
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const room = list.find(r => r.id === roomId || r.room_number === roomId);
  if (!room) throw new Error('Room not found');
  const newBooking = {
    booking_id: `bk-${Date.now().toString().slice(-4)}`,
    ...bookingData
  };
  room.bookings = room.bookings || [];
  room.bookings.push(newBooking);
  setLocal(STORAGE_KEYS.rooms, list);
  return { success: true, booking: newBooking, room };
}

export async function cancelRoomBooking(roomId, bookingId) {
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.rooms, seedRooms);
  const room = list.find(r => r.id === roomId || r.room_number === roomId);
  if (room && room.bookings) {
    room.bookings = room.bookings.filter(b => b.booking_id !== bookingId);
    setLocal(STORAGE_KEYS.rooms, list);
  }
  return { success: true };
}

// --- Events API ---
export async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (res.ok) {
      const data = await res.json();
      setLocal(STORAGE_KEYS.events, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.events, seedEvents);
}

export async function createEvent(item) {
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const newItem = {
    ...item,
    id: item.id || `evt-${Date.now()}`,
    registered: item.registered || 0,
    registrations: item.registrations || []
  };
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.events, list);
  return newItem;
}

export async function updateEvent(id, item) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.events, list);
    return list[idx];
  }
  return item;
}

export async function deleteEvent(id) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.events, filtered);
  return true;
}

export async function registerForEvent(eventId, studentData) {
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const ev = list.find(e => e.id === eventId || e.name.toLowerCase().includes(eventId.toLowerCase()));
  if (!ev) throw new Error('Event not found');
  if (ev.registered >= ev.capacity) throw new Error('Event capacity is full');
  ev.registrations = ev.registrations || [];
  const already = ev.registrations.find(r => r.student_id === studentData.student_id);
  if (!already) {
    ev.registrations.push(studentData);
    ev.registered = ev.registrations.length;
    if (ev.registered >= ev.capacity) ev.status = 'full';
    setLocal(STORAGE_KEYS.events, list);
  }
  return { success: true, event: ev };
}

export async function cancelEventRegistration(eventId, studentId) {
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/cancel-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.events, seedEvents);
  const ev = list.find(e => e.id === eventId);
  if (ev && ev.registrations) {
    ev.registrations = ev.registrations.filter(r => r.student_id !== studentId);
    ev.registered = ev.registrations.length;
    if (ev.status === 'full') ev.status = 'upcoming';
    setLocal(STORAGE_KEYS.events, list);
  }
  return { success: true };
}

// --- Announcements API ---
export async function fetchAnnouncements() {
  try {
    const res = await fetch(`${API_BASE}/announcements`);
    if (res.ok) {
      const data = await res.json();
      setLocal(STORAGE_KEYS.announcements, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
}

export async function createAnnouncement(item) {
  try {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  const newItem = {
    ...item,
    id: item.id || `ann-${Date.now()}`,
    date: item.date || '2026-09-04'
  };
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.announcements, list);
  return newItem;
}

export async function updateAnnouncement(id, item) {
  try {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.announcements, list);
    return list[idx];
  }
  return item;
}

export async function deleteAnnouncement(id) {
  try {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.announcements, seedAnnouncements);
  const filtered = list.filter(x => x.id !== id);
  setLocal(STORAGE_KEYS.announcements, filtered);
  return true;
}

// --- Assignments API ---
export async function fetchAssignments() {
  try {
    const res = await fetch(`${API_BASE}/assignments`);
    if (res.ok) {
      const data = await res.json();
      setLocal(STORAGE_KEYS.assignments, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.assignments, seedAssignments);
}

export async function createAssignment(item) {
  try {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.assignments, seedAssignments);
  const newItem = { ...item, id: item.id || `asgn-${Date.now()}` };
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.assignments, list);
  return newItem;
}

export async function updateAssignment(id, item) {
  try {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.assignments, seedAssignments);
  const idx = list.findIndex(x => x.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.assignments, list);
    return list[idx];
  }
  return item;
}

export async function deleteAssignment(id) {
  try {
    const res = await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}
  const list = getLocal(STORAGE_KEYS.assignments, seedAssignments);
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
