import { store } from '../config/db.js';

export const toolExecutors = {
  get_schedules: async (args = {}) => {
    const { day, course, instructor, room } = args;
    let list = store.getAll('schedules');
    if (day) list = list.filter(s => s.day.toLowerCase() === day.toLowerCase());
    if (course) list = list.filter(s => s.course.toLowerCase().includes(course.toLowerCase()));
    if (instructor) list = list.filter(s => s.instructor.toLowerCase().includes(instructor.toLowerCase()));
    if (room) list = list.filter(s => s.room.toLowerCase().includes(room.toLowerCase()));
    return list;
  },

  get_rooms: async (args = {}) => {
    const { type, min_capacity, equipment } = args;
    let list = store.getAll('rooms');
    if (type) list = list.filter(r => r.type.toLowerCase() === type.toLowerCase());
    if (min_capacity) list = list.filter(r => r.capacity >= Number(min_capacity));
    if (equipment && Array.isArray(equipment)) {
      list = list.filter(r =>
        equipment.every(eq => r.equipment?.map(x => x.toLowerCase()).includes(eq.toLowerCase()))
      );
    }
    return list;
  },

  check_room_availability: async (args = {}) => {
    const { room_number, date, start_time, end_time } = args;
    const room = store.getById('rooms', room_number);
    if (!room) return { available: false, error: `Room ${room_number} does not exist.` };

    const bookings = room.bookings || [];
    const conflict = bookings.find(b => {
      if (b.date !== date) return false;
      return (start_time < b.end_time) && (end_time > b.start_time);
    });

    if (conflict) {
      return {
        available: false,
        conflict: `Already booked by ${conflict.booked_by} (${conflict.start_time}–${conflict.end_time}) for "${conflict.purpose}"`
      };
    }

    return { available: true, message: `Room ${room_number} is completely available on ${date} from ${start_time} to ${end_time}.` };
  },

  book_room: async (args = {}) => {
    const { room_number, date, start_time, end_time, booked_by, purpose } = args;
    const room = store.getById('rooms', room_number);
    if (!room) return { success: false, error: `Room ${room_number} not found.` };

    const bookings = room.bookings || [];
    const conflict = bookings.find(b => b.date === date && (start_time < b.end_time) && (end_time > b.start_time));
    if (conflict) {
      return { success: false, error: `Room ${room_number} is already booked by ${conflict.booked_by}.` };
    }

    const newBooking = {
      booking_id: `bk-${Date.now().toString().slice(-4)}`,
      booked_by: booked_by || 'Student',
      date,
      start_time,
      end_time,
      purpose: purpose || 'Room reservation'
    };

    bookings.push(newBooking);
    store.update('rooms', room.id, { bookings });

    return {
      success: true,
      booking_id: newBooking.booking_id,
      room_number,
      date,
      start_time,
      end_time,
      booked_by: newBooking.booked_by
    };
  },

  cancel_room_booking: async (args = {}) => {
    const { room_number, booking_id } = args;
    const room = store.getById('rooms', room_number);
    if (!room) return { success: false, error: 'Room not found.' };

    const initialLen = (room.bookings || []).length;
    room.bookings = (room.bookings || []).filter(b => b.booking_id !== booking_id);

    if (room.bookings.length === initialLen) {
      return { success: false, error: `Booking ID ${booking_id} not found for Room ${room_number}.` };
    }

    store.update('rooms', room.id, { bookings: room.bookings });
    return { success: true, message: `Booking ${booking_id} cancelled.` };
  },

  get_events: async (args = {}) => {
    const { date, status } = args;
    let list = store.getAll('events');
    if (date) list = list.filter(e => e.date === date);
    if (status) list = list.filter(e => e.status.toLowerCase() === status.toLowerCase());
    return list;
  },

  register_for_event: async (args = {}) => {
    const { event_name_or_id, student_id, name } = args;
    const events = store.getAll('events');
    const ev = events.find(e =>
      e.id === event_name_or_id ||
      e.name.toLowerCase().includes(event_name_or_id.toLowerCase())
    );

    if (!ev) return { success: false, error: `Event "${event_name_or_id}" not found.` };

    ev.registrations = ev.registrations || [];
    if (ev.registrations.length >= ev.capacity) {
      return { success: false, error: `Event "${ev.name}" is already at full capacity (${ev.capacity} seats).` };
    }

    const already = ev.registrations.find(r => r.student_id === student_id);
    if (already) {
      return { success: false, error: `Student ${student_id} is already registered for this event.` };
    }

    ev.registrations.push({ student_id, name });
    ev.registered = ev.registrations.length;
    if (ev.registered >= ev.capacity) ev.status = 'full';

    store.update('events', ev.id, {
      registrations: ev.registrations,
      registered: ev.registered,
      status: ev.status
    });

    return {
      success: true,
      event_name: ev.name,
      student_id,
      name,
      venue: ev.venue,
      date: ev.date,
      start_time: ev.start_time
    };
  },

  get_announcements: async (args = {}) => {
    const { priority, keyword } = args;
    let list = store.getAll('announcements');
    if (priority) list = list.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(kw) || a.body.toLowerCase().includes(kw));
    }
    return list;
  },

  get_assignments: async (args = {}) => {
    const { status, course } = args;
    let list = store.getAll('assignments');
    if (status) list = list.filter(a => a.status.toLowerCase() === status.toLowerCase());
    if (course) list = list.filter(a => a.course.toLowerCase().includes(course.toLowerCase()));
    return list;
  }
};
