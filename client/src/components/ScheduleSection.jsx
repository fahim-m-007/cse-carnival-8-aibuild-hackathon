import React, { useState } from 'react';
import { Search, Clock, MapPin, User, BookOpen, Edit2, Trash2, Calendar } from 'lucide-react';
import { isItemOwner } from '../services/api';
import './SectionCommon.css';

export default function ScheduleSection({
  schedules,
  onEdit,
  onDelete,
  currentUser = null
}) {
  const [selectedDay, setSelectedDay] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const days = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const filtered = schedules.filter((item) => {
    const matchDay = selectedDay === 'All' || item.day === selectedDay;
    const matchSearch =
      item.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.room?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDay && matchSearch;
  });

  return (
    <div className="section-wrapper">
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search course code, title, room, instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {days.map((day) => (
            <button
              key={day}
              className={`filter-pill ${selectedDay === day ? 'active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={36} color="#94A3B8" />
          <h3 style={{ marginTop: '0.75rem', fontWeight: 600 }}>No classes match your filter</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try selecting a different day or clearing the search keyword.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((item) => {
            const isOwner = isItemOwner(item, currentUser);
            return (
              <div key={item.id} className="item-card">
                <div>
                  <div className="card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-green">
                          {item.course}
                        </span>
                        {isOwner && (
                          <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                            Added by You
                          </span>
                        )}
                      </div>
                      <h4 className="card-title">{item.title}</h4>
                      <div className="card-subtitle">Section: {item.section || 'All'}</div>
                    </div>
                    <span className="badge badge-gray">{item.day}</span>
                  </div>

                  <div className="card-body">
                    <div className="card-meta-row">
                      <Clock size={15} />
                      <span>
                        <strong>{item.start_time}</strong> — <strong>{item.end_time}</strong>
                      </span>
                    </div>

                    <div className="card-meta-row">
                      <MapPin size={15} />
                      <span>Room <strong>{item.room}</strong></span>
                    </div>

                    <div className="card-meta-row">
                      <User size={15} />
                      <span>{item.instructor || 'TBA'}</span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="card-actions">
                    <button
                      className="btn-card-action"
                      onClick={() => onEdit('schedules', item)}
                      title="Edit class"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="btn-card-action danger"
                      onClick={() => onDelete('schedules', item.id, `${item.course} on ${item.day}`)}
                      title="Cancel/Delete class"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
