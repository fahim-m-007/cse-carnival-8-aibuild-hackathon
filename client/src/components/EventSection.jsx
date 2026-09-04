import React, { useState } from 'react';
import { Search, Calendar, Clock, MapPin, UserCheck, Trash2, Edit2, UserPlus, Users, PartyPopper } from 'lucide-react';
import { isItemOwner, formatToYYYYMMDD } from '../services/api';
import './SectionCommon.css';

export default function EventSection({
  events,
  onEdit,
  onDelete,
  onOpenRegisterModal,
  onCancelRegistration,
  currentUser = null
}) {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEventId, setExpandedEventId] = useState(null);

  const statuses = ['All', 'upcoming', 'ongoing', 'completed', 'full'];

  const filtered = events.filter((ev) => {
    const matchStatus = selectedStatus === 'All' || ev.status === selectedStatus;
    const matchSearch =
      ev.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.organizer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="section-wrapper">
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search event, venue, or organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {statuses.map((st) => (
            <button
              key={st}
              className={`filter-pill ${selectedStatus === st ? 'active' : ''}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="cards-grid">
        {filtered.map((ev) => {
          const registeredCount = ev.registered || (ev.registrations ? ev.registrations.length : 0);
          const capacity = ev.capacity || 1;
          const percentage = Math.min(100, Math.round((registeredCount / capacity) * 100));
          const isFull = registeredCount >= capacity || ev.status === 'full';
          const isExpanded = expandedEventId === ev.id;
          const isOwner = isItemOwner(ev, currentUser);
          const isUserRegistered = ev.registrations?.some(
            (r) => (r.student_id || '').trim().toLowerCase() === (currentUser?.studentId || '').trim().toLowerCase()
          );

          return (
            <div key={ev.id} className="item-card">
              <div>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{ev.name}</h3>
                    <div className="card-subtitle">
                      By {ev.organizer}
                      {isOwner && (
                        <span className="badge badge-green" style={{ marginLeft: '6px', fontSize: '0.68rem' }}>
                          Added by You
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      isFull
                        ? 'badge-red'
                        : ev.status === 'ongoing'
                        ? 'badge-gold'
                        : 'badge-green'
                    }`}
                  >
                    {isFull ? 'FULL' : ev.status}
                  </span>
                </div>

                <div className="card-body">
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', marginBottom: '0.85rem' }}>
                    {ev.description}
                  </p>

                  <div className="card-meta-row">
                    <Calendar size={15} />
                    <span>
                      {formatToYYYYMMDD(ev.date)} {ev.end_date && formatToYYYYMMDD(ev.end_date) !== formatToYYYYMMDD(ev.date) ? `to ${formatToYYYYMMDD(ev.end_date)}` : ''}
                    </span>
                  </div>

                  <div className="card-meta-row">
                    <Clock size={15} />
                    <span>{ev.start_time} – {ev.end_time}</span>
                  </div>

                  <div className="card-meta-row">
                    <MapPin size={15} />
                    <span>Venue: Room <strong>{ev.venue}</strong></span>
                  </div>

                  {/* Capacity Progress */}
                  <div className="capacity-container">
                    <div className="capacity-labels">
                      <span>Registrations</span>
                      <span>
                        <strong>{registeredCount}</strong> / {capacity} seats ({percentage}%)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-bar ${isFull ? 'full' : ''}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Attendee Toggle */}
                  {ev.registrations && ev.registrations.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--aust-green)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Users size={13} />
                        <span>{isExpanded ? 'Hide Attendees' : `View Attendees (${ev.registrations.length})`}</span>
                      </button>

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            background: '#F8FAFC',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            maxHeight: '130px',
                            overflowY: 'auto'
                          }}
                        >
                          {ev.registrations.map((reg) => {
                            const isMyRegistration =
                              currentUser &&
                              (reg.student_id || '').trim().toLowerCase() === (currentUser.studentId || '').trim().toLowerCase();

                            return (
                              <div
                                key={reg.student_id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.76rem',
                                  padding: '0.3rem 0',
                                  borderBottom: '1px solid #E2E8F0'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>{reg.name} ({reg.student_id})</span>
                                  {isMyRegistration && (
                                    <span
                                      className="badge badge-green"
                                      style={{ fontSize: '0.65rem', padding: '0.08rem 0.38rem' }}
                                    >
                                      You
                                    </span>
                                  )}
                                </div>

                                {/* Only the current student can remove their own registration */}
                                {isMyRegistration && (
                                  <button
                                    onClick={() => onCancelRegistration(ev.id, reg.student_id)}
                                    style={{ color: 'var(--aust-red)', padding: '2px', marginLeft: '6px' }}
                                    title="Cancel your registration"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card-actions">
                {isUserRegistered ? (
                  <button
                    className="btn-card-action"
                    disabled
                    style={{
                      color: 'var(--aust-green)',
                      borderColor: 'var(--aust-green-border)',
                      background: 'var(--aust-green-light)',
                      cursor: 'default'
                    }}
                    title="You are registered for this event"
                  >
                    <UserCheck size={13} />
                    <span>Registered</span>
                  </button>
                ) : (
                  <button
                    className="btn-card-action primary"
                    disabled={isFull}
                    onClick={() => onOpenRegisterModal(ev)}
                    style={isFull ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    title={isFull ? 'Event is full' : 'Register for this event'}
                  >
                    <UserPlus size={13} />
                    <span>{isFull ? 'Full' : 'Register'}</span>
                  </button>
                )}

                {/* Only creator can edit/delete their own event */}
                {isOwner && (
                  <>
                    <button
                      className="btn-card-action"
                      onClick={() => onEdit('events', ev)}
                      title="Edit this event"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      className="btn-card-action danger"
                      onClick={() => onDelete('events', ev.id, ev.name)}
                      title="Delete this event"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
