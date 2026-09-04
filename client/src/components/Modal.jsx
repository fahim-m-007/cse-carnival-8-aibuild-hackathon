import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  onSubmit,
  type, // 'schedules' | 'rooms' | 'events' | 'announcements' | 'assignments' | 'bookRoom' | 'registerEvent'
  initialData = null
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // Default empty templates
      if (type === 'schedules') {
        setFormData({
          course: '',
          title: '',
          day: 'Sunday',
          start_time: '08:00',
          end_time: '08:50',
          room: '7A01',
          instructor: '',
          section: 'A'
        });
      } else if (type === 'rooms') {
        setFormData({
          room_number: '',
          type: 'classroom',
          capacity: 40,
          floor: 7,
          equipmentStr: 'whiteboard, projector, AC',
          status: 'available'
        });
      } else if (type === 'events') {
        setFormData({
          name: '',
          description: '',
          date: '2026-09-08',
          start_time: '14:00',
          end_time: '16:00',
          end_date: '2026-09-08',
          venue: '7C01',
          organizer: 'CSE Department',
          capacity: 50,
          status: 'upcoming'
        });
      } else if (type === 'announcements') {
        setFormData({
          title: '',
          body: '',
          priority: 'high',
          posted_by: 'CSE Department',
          expires: '2026-09-10'
        });
      } else if (type === 'assignments') {
        setFormData({
          course: 'CSE 4113',
          course_title: 'Pattern Recognition and Machine Learning',
          title: '',
          description: '',
          assigned_date: '2026-09-04',
          deadline: '2026-09-12',
          submission_platform: 'Google Classroom',
          status: 'pending',
          marks: 10
        });
      } else if (type === 'bookRoom') {
        setFormData({
          date: '2026-09-05',
          start_time: '15:00',
          end_time: '17:00',
          booked_by: '',
          purpose: 'Group Study Session'
        });
      } else if (type === 'registerEvent') {
        setFormData({
          student_id: '',
          name: ''
        });
      }
    }
  }, [type, initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type: inputType } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (type === 'rooms' && typeof finalData.equipmentStr === 'string') {
      finalData.equipment = finalData.equipmentStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      delete finalData.equipmentStr;
    }
    onSubmit(finalData);
  };

  const getTitle = () => {
    if (type === 'bookRoom') return `Book Room ${initialData?.room_number || ''}`;
    if (type === 'registerEvent') return `Register for "${initialData?.name || ''}"`;
    const action = initialData?.id ? 'Edit' : 'Add New';
    const labelMap = {
      schedules: 'Class Schedule',
      rooms: 'Campus Room',
      events: 'Campus Event',
      announcements: 'Announcement',
      assignments: 'Assignment'
    };
    return `${action} ${labelMap[type] || 'Record'}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{getTitle()}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. SCHEDULE FORM */}
            {type === 'schedules' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      name="course"
                      required
                      placeholder="e.g. CSE 4113"
                      value={formData.course || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Section</label>
                    <input
                      name="section"
                      placeholder="e.g. B or B1/B2"
                      value={formData.section || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Course Title</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Pattern Recognition and Machine Learning"
                    value={formData.title || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Day of Week</label>
                    <select name="day" value={formData.day || 'Sunday'} onChange={handleChange}>
                      <option value="Sunday">Sunday</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room Number</label>
                    <input
                      name="room"
                      required
                      placeholder="e.g. 7A04"
                      value={formData.room || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time (24h)</label>
                    <input
                      name="start_time"
                      type="time"
                      required
                      value={formData.start_time || '08:00'}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time (24h)</label>
                    <input
                      name="end_time"
                      type="time"
                      required
                      value={formData.end_time || '08:50'}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Instructor</label>
                  <input
                    name="instructor"
                    placeholder="e.g. Prof. Dr. Md. Shahriar Mahbub"
                    value={formData.instructor || ''}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* 2. ROOM FORM */}
            {type === 'rooms' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Room Number</label>
                    <input
                      name="room_number"
                      required
                      placeholder="e.g. 7A08"
                      value={formData.room_number || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select name="type" value={formData.type || 'classroom'} onChange={handleChange}>
                      <option value="classroom">Classroom</option>
                      <option value="lab">Lab</option>
                      <option value="seminar">Seminar</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity</label>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      required
                      value={formData.capacity || 40}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Floor</label>
                    <input
                      name="floor"
                      type="number"
                      value={formData.floor || 7}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Equipment (comma separated)</label>
                  <input
                    name="equipmentStr"
                    placeholder="projector, AC, whiteboard, smart board"
                    value={
                      formData.equipmentStr !== undefined
                        ? formData.equipmentStr
                        : Array.isArray(formData.equipment)
                        ? formData.equipment.join(', ')
                        : 'whiteboard, projector, AC'
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status || 'available'} onChange={handleChange}>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </>
            )}

            {/* 3. EVENT FORM */}
            {type === 'events' && (
              <>
                <div className="form-group">
                  <label>Event Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Workshop on Generative AI"
                    value={formData.name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    required
                    placeholder="Provide details about the session..."
                    value={formData.description || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date (YYYY-MM-DD)</label>
                    <input
                      name="date"
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Venue Room</label>
                    <input
                      name="venue"
                      required
                      placeholder="e.g. 7C01"
                      value={formData.venue || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      name="start_time"
                      type="time"
                      required
                      value={formData.start_time || '10:00'}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      name="end_time"
                      type="time"
                      required
                      value={formData.end_time || '12:00'}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity</label>
                    <input
                      name="capacity"
                      type="number"
                      required
                      value={formData.capacity || 50}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Organizer</label>
                    <input
                      name="organizer"
                      placeholder="e.g. AUSTPIC"
                      value={formData.organizer || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 4. ANNOUNCEMENT FORM */}
            {type === 'announcements' && (
              <>
                <div className="form-group">
                  <label>Headline Title</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. CSE 4113 Class Rescheduled to Room 7A04"
                    value={formData.title || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Notice Body</label>
                  <textarea
                    name="body"
                    rows="4"
                    required
                    placeholder="Write the full announcement contents..."
                    value={formData.body || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={formData.priority || 'high'}
                      onChange={handleChange}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Posted By</label>
                    <input
                      name="posted_by"
                      placeholder="e.g. Prof. Dr. Faisal Muhammad Shah"
                      value={formData.posted_by || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    name="expires"
                    type="date"
                    value={formData.expires || ''}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* 5. ASSIGNMENT FORM */}
            {type === 'assignments' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      name="course"
                      required
                      placeholder="e.g. CSE 4130"
                      value={formData.course || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status || 'pending'}
                      onChange={handleChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="graded">Graded</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Assignment Title</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Lab Report 2: Lexical Analysis"
                    value={formData.title || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Task details and instructions..."
                    value={formData.description || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Deadline (YYYY-MM-DD)</label>
                    <input
                      name="deadline"
                      type="date"
                      required
                      value={formData.deadline || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Marks</label>
                    <input
                      name="marks"
                      type="number"
                      value={formData.marks || 10}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Submission Platform</label>
                  <input
                    name="submission_platform"
                    placeholder="e.g. Google Classroom or Physical"
                    value={formData.submission_platform || 'Google Classroom'}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* 6. BOOK ROOM FORM */}
            {type === 'bookRoom' && (
              <>
                <div className="form-group">
                  <label>Date (YYYY-MM-DD)</label>
                  <input
                    name="date"
                    type="date"
                    required
                    value={formData.date || '2026-09-05'}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time (24h)</label>
                    <input
                      name="start_time"
                      type="time"
                      required
                      value={formData.start_time || '15:00'}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time (24h)</label>
                    <input
                      name="end_time"
                      type="time"
                      required
                      value={formData.end_time || '17:00'}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Booked By</label>
                  <input
                    name="booked_by"
                    required
                    placeholder="Your Name or Club Name"
                    value={formData.booked_by || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Purpose</label>
                  <input
                    name="purpose"
                    required
                    placeholder="e.g. Study Group, Project Discussion"
                    value={formData.purpose || ''}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* 7. REGISTER FOR EVENT FORM */}
            {type === 'registerEvent' && (
              <>
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    name="student_id"
                    required
                    placeholder="e.g. 21-44567"
                    value={formData.student_id || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Student Full Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Fahim Morshed"
                    value={formData.name || ''}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
