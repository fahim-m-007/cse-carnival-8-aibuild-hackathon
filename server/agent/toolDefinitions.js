// Universal Function Calling Tool Definitions (OpenAI & Gemini compatible)

export const toolDefinitions = [
  {
    name: 'get_schedules',
    description: 'Retrieve live university class schedules. Filter by day of week (Sunday, Monday, Tuesday, Wednesday, Thursday), course code, instructor, or room.',
    parameters: {
      type: 'object',
      properties: {
        day: {
          type: 'string',
          description: 'Day of the week: Sunday, Monday, Tuesday, Wednesday, Thursday'
        },
        course: {
          type: 'string',
          description: 'Course code (e.g. CSE 4113)'
        },
        instructor: {
          type: 'string',
          description: 'Instructor name'
        },
        room: {
          type: 'string',
          description: 'Room number (e.g. 7A07)'
        }
      }
    }
  },
  {
    name: 'get_rooms',
    description: 'Find rooms matching criteria like room type, minimum capacity, floor, or equipment (e.g. projector, AC, whiteboard, smart board).',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['classroom', 'lab', 'seminar'],
          description: 'Type of room'
        },
        min_capacity: {
          type: 'number',
          description: 'Minimum required seating capacity'
        },
        equipment: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of required equipment, e.g. ["projector", "AC"]'
        }
      }
    }
  },
  {
    name: 'check_room_availability',
    description: 'Check if a room is available on a specific date and time slot with no booking conflicts.',
    parameters: {
      type: 'object',
      properties: {
        room_number: {
          type: 'string',
          description: 'Room code (e.g. 7A02)'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (e.g. 2026-09-05)'
        },
        start_time: {
          type: 'string',
          description: 'Start time in 24h format HH:MM (e.g. 15:00)'
        },
        end_time: {
          type: 'string',
          description: 'End time in 24h format HH:MM (e.g. 17:00)'
        }
      },
      required: ['room_number', 'date', 'start_time', 'end_time']
    }
  },
  {
    name: 'book_room',
    description: 'Book and reserve a specific room for a given date, start time, end time, and purpose. DO NOT call this if the request is vague without a specific room and exact time.',
    parameters: {
      type: 'object',
      properties: {
        room_number: {
          type: 'string',
          description: 'Room number to book (e.g. 7A02)'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (e.g. 2026-09-05)'
        },
        start_time: {
          type: 'string',
          description: 'Start time HH:MM (e.g. 15:00)'
        },
        end_time: {
          type: 'string',
          description: 'End time HH:MM (e.g. 17:00)'
        },
        booked_by: {
          type: 'string',
          description: 'Name of the student or club booking the room'
        },
        purpose: {
          type: 'string',
          description: 'Purpose for booking (e.g. Study session)'
        }
      },
      required: ['room_number', 'date', 'start_time', 'end_time', 'booked_by']
    }
  },
  {
    name: 'cancel_room_booking',
    description: 'Cancel an existing booking for a room given the room number and booking ID.',
    parameters: {
      type: 'object',
      properties: {
        room_number: {
          type: 'string',
          description: 'Room number (e.g. 7A06)'
        },
        booking_id: {
          type: 'string',
          description: 'Booking ID (e.g. bk-001)'
        }
      },
      required: ['room_number', 'booking_id']
    }
  },
  {
    name: 'get_events',
    description: 'Retrieve campus events, workshops, guest lectures, and hackathons.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        },
        status: {
          type: 'string',
          description: 'Status filter: upcoming, ongoing, completed, full'
        }
      }
    }
  },
  {
    name: 'register_for_event',
    description: 'Register a student for a campus event by name or event ID.',
    parameters: {
      type: 'object',
      properties: {
        event_name_or_id: {
          type: 'string',
          description: 'Name or ID of the event (e.g. "Guest Lecture: Deep Learning in Medical Imaging" or "evt-002")'
        },
        student_id: {
          type: 'string',
          description: 'Student ID (e.g. 20-40532)'
        },
        name: {
          type: 'string',
          description: 'Student Name (e.g. Sakibul Hassan)'
        }
      },
      required: ['event_name_or_id', 'student_id', 'name']
    }
  },
  {
    name: 'get_announcements',
    description: 'Retrieve campus announcements, emergency updates, syllabus notices, and rescheduled classes.',
    parameters: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Priority level of announcements'
        },
        keyword: {
          type: 'string',
          description: 'Optional keyword to search within announcements (e.g. CSE321, library, canteen)'
        }
      }
    }
  },
  {
    name: 'get_assignments',
    description: 'Retrieve academic assignments, submission deadlines, and grading status.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'submitted', 'graded', 'late'],
          description: 'Status of assignments'
        },
        course: {
          type: 'string',
          description: 'Course code (e.g. CSE 4113)'
        }
      }
    }
  }
];
