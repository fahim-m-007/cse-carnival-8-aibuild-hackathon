import React from 'react';
import { 
  Calendar, 
  DoorOpen, 
  PartyPopper, 
  Bell, 
  FileText, 
  Clock, 
  MapPin, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  Trash2
} from 'lucide-react';
import './DashboardSection.css';
import { formatToYYYYMMDD } from '../services/api';

export default function DashboardSection({
  currentUser,
  schedules = [],
  rooms = [],
  events = [],
  announcements = [],
  assignments = [],
  onNavigate,
  onCancelRegistration,
  onCancelBooking
}) {
  const currentStudentId = (currentUser?.studentId || '').trim().toLowerCase();
  const currentStudentName = (currentUser?.name || '').trim().toLowerCase();

  // 1. Filter events registered by this user
  const myRegisteredEvents = events.filter(ev => 
    ev.registrations && ev.registrations.some(r => 
      (r.student_id || '').trim().toLowerCase() === currentStudentId
    )
  );

  // 2. Filter room bookings made by this user
  const myBookings = [];
  rooms.forEach(room => {
    (room.bookings || []).forEach(b => {
      const bookedByLower = (b.booked_by || '').trim().toLowerCase();
      if (bookedByLower.includes(currentStudentName) || (currentStudentId && bookedByLower.includes(currentStudentId))) {
        myBookings.push({
          ...b,
          roomId: room.id,
          room_number: room.room_number,
          floor: room.floor
        });
      }
    });
  });

  // 3. Pending assignments
  const pendingAssignments = assignments.filter(a => a.status === 'pending');

  // 4. High-priority announcements
  const urgentAnnouncements = announcements.filter(a => a.priority === 'high');

  // 5. Today's classes (Fallback to Sunday or all if today has none in seed)
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = daysOfWeek[new Date().getDay()];
  let todayClasses = schedules.filter(s => (s.day || '').toLowerCase() === todayDayName.toLowerCase());
  if (todayClasses.length === 0) {
    todayClasses = schedules.filter(s => (s.day || '').toLowerCase() === 'sunday');
  }

  return (
    <div className="user-dashboard">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-left">
          <div className="welcome-tag">Student Portal · Connected to MongoDB</div>
          <h2 className="welcome-title">
            Welcome back, <span>{currentUser?.name || 'AUST Student'}</span>
          </h2>
          <div className="welcome-meta">
            <span className="meta-pill">ID: <strong>{currentUser?.studentId || 'N/A'}</strong></span>
            <span className="meta-pill dept">Dept: <strong>{currentUser?.dept || 'CSE'}</strong></span>
            <span className="meta-pill email">{currentUser?.eduMail || 'aust.edu'}</span>
          </div>
        </div>
        <div className="welcome-quick-actions">
          <button className="quick-action-btn" onClick={() => onNavigate('events')}>
            <PartyPopper size={14} />
            <span>Campus Events</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('rooms')}>
            <DoorOpen size={14} />
            <span>Study Rooms</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate('assignments')}>
            <FileText size={14} />
            <span>Assignments</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate('events')}>
          <div className="kpi-icon-wrap green">
            <UserCheck size={22} />
          </div>
          <div className="kpi-data">
            <div className="kpi-value">{myRegisteredEvents.length}</div>
            <div className="kpi-label">My Registered Events</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('rooms')}>
          <div className="kpi-icon-wrap blue">
            <DoorOpen size={22} />
          </div>
          <div className="kpi-data">
            <div className="kpi-value">{myBookings.length}</div>
            <div className="kpi-label">My Room Bookings</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('assignments')}>
          <div className="kpi-icon-wrap amber">
            <FileText size={22} />
          </div>
          <div className="kpi-data">
            <div className="kpi-value">{pendingAssignments.length}</div>
            <div className="kpi-label">Pending Assignments</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('announcements')}>
          <div className="kpi-icon-wrap red">
            <Bell size={22} />
          </div>
          <div className="kpi-data">
            <div className="kpi-value">{urgentAnnouncements.length}</div>
            <div className="kpi-label">Urgent Notices</div>
          </div>
        </div>
      </div>

      {/* Two-Column Detail View */}
      <div className="dashboard-columns-grid">
        {/* Left Column: My Registrations & Bookings */}
        <div className="dashboard-col">
          {/* Section: My Registered Events */}
          <div className="dashboard-card-section">
            <div className="section-card-header">
              <div className="section-card-title">
                <PartyPopper size={16} />
                <span>My Registered Events ({myRegisteredEvents.length})</span>
              </div>
              <button className="view-all-link" onClick={() => onNavigate('events')}>
                <span>Browse All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {myRegisteredEvents.length === 0 ? (
              <div className="empty-dashboard-box">
                <p>You haven't registered for any campus events yet.</p>
                <button className="btn-empty-action" onClick={() => onNavigate('events')}>
                  Explore Events & Register
                </button>
              </div>
            ) : (
              <div className="dashboard-items-list">
                {myRegisteredEvents.map(ev => (
                  <div key={ev.id} className="dashboard-item-card">
                    <div className="item-main">
                      <div className="item-title">{ev.name}</div>
                      <div className="item-sub-meta">
                        <span><Clock size={12} /> {formatToYYYYMMDD(ev.date)} · {ev.start_time}</span>
                        <span><MapPin size={12} /> Room <strong>{ev.venue}</strong></span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="badge badge-green">Registered</span>
                      <button 
                        className="btn-cancel-icon"
                        title="Cancel Registration"
                        onClick={() => onCancelRegistration(ev.id, currentUser?.studentId)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: My Room Bookings */}
          <div className="dashboard-card-section">
            <div className="section-card-header">
              <div className="section-card-title">
                <DoorOpen size={16} />
                <span>My Room Bookings ({myBookings.length})</span>
              </div>
              <button className="view-all-link" onClick={() => onNavigate('rooms')}>
                <span>Browse Rooms</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="empty-dashboard-box">
                <p>No active study room reservations in your name.</p>
                <button className="btn-empty-action" onClick={() => onNavigate('rooms')}>
                  Reserve a Study Room
                </button>
              </div>
            ) : (
              <div className="dashboard-items-list">
                {myBookings.map(bk => (
                  <div key={bk.booking_id} className="dashboard-item-card">
                    <div className="item-main">
                      <div className="item-title">Room {bk.room_number}</div>
                      <div className="item-sub-meta">
                        <span><Clock size={12} /> {formatToYYYYMMDD(bk.date)} · {bk.start_time} - {bk.end_time}</span>
                        <span>{bk.purpose}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="badge badge-blue">Booked</span>
                      <button 
                        className="btn-cancel-icon"
                        title="Cancel Booking"
                        onClick={() => onCancelBooking(bk.roomId, bk.booking_id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Classes Routine & Urgent Alerts */}
        <div className="dashboard-col">
          {/* Section: Today's Class Schedule */}
          <div className="dashboard-card-section">
            <div className="section-card-header">
              <div className="section-card-title">
                <Calendar size={16} />
                <span>Class Schedule ({todayDayName} / Regular)</span>
              </div>
              <button className="view-all-link" onClick={() => onNavigate('schedules')}>
                <span>Full Schedule</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="empty-dashboard-box">
                <p>No scheduled classes found for today.</p>
              </div>
            ) : (
              <div className="dashboard-items-list">
                {todayClasses.slice(0, 4).map(sch => (
                  <div key={sch.id} className="dashboard-item-card schedule-item">
                    <div className="schedule-time-block">
                      <span className="sch-start">{sch.start_time}</span>
                      <span className="sch-end">{sch.end_time}</span>
                    </div>
                    <div className="item-main">
                      <div className="item-title">{sch.course} · {sch.title}</div>
                      <div className="item-sub-meta">
                        <span><MapPin size={12} /> Room <strong>{sch.room}</strong></span>
                        <span>Instructor: {sch.instructor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: High-Priority Notices & Deadlines */}
          <div className="dashboard-card-section">
            <div className="section-card-header">
              <div className="section-card-title">
                <AlertCircle size={16} />
                <span>Urgent Notices & Pending Deadlines</span>
              </div>
              <button className="view-all-link" onClick={() => onNavigate('announcements')}>
                <span>All Notices</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="dashboard-items-list">
              {urgentAnnouncements.slice(0, 2).map(ann => (
                <div key={ann.id} className="dashboard-item-card urgent-card">
                  <div className="item-main">
                    <div className="item-title urgent-title">
                      <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>URGENT</span>
                      {ann.title}
                    </div>
                    <div className="item-body-snippet">{ann.body}</div>
                  </div>
                </div>
              ))}

              {pendingAssignments.slice(0, 2).map(asgn => (
                <div key={asgn.id} className="dashboard-item-card">
                  <div className="item-main">
                    <div className="item-title">
                      <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>DUE</span>
                      {asgn.course}: {asgn.title}
                    </div>
                    <div className="item-sub-meta">
                      <span>Deadline: <strong>{formatToYYYYMMDD(asgn.deadline)}</strong></span>
                      <span>Platform: {asgn.submission_platform}</span>
                    </div>
                  </div>
                </div>
              ))}

              {urgentAnnouncements.length === 0 && pendingAssignments.length === 0 && (
                <div className="empty-dashboard-box">
                  <p>No urgent notices or impending deadlines right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
