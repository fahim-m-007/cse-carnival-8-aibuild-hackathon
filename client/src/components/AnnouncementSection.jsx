import React, { useState } from 'react';
import { Search, AlertCircle, Calendar, User, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { isItemOwner, formatToYYYYMMDD } from '../services/api';
import './SectionCommon.css';

export default function AnnouncementSection({
  announcements,
  onEdit,
  onDelete,
  currentUser = null
}) {
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const priorities = ['All', 'high', 'medium', 'low'];

  const filtered = announcements.filter((item) => {
    const matchPriority = selectedPriority === 'All' || item.priority === selectedPriority;
    const matchSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.posted_by?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPriority && matchSearch;
  });

  return (
    <div className="section-wrapper">
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search announcement title, body, author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {priorities.map((pri) => (
            <button
              key={pri}
              className={`filter-pill ${selectedPriority === pri ? 'active' : ''}`}
              onClick={() => setSelectedPriority(pri)}
            >
              {pri.charAt(0).toUpperCase() + pri.slice(1)} Priority
            </button>
          ))}
        </div>
      </div>

      <div className="cards-grid">
        {filtered.map((ann) => {
          const isHigh = ann.priority === 'high';
          const isMedium = ann.priority === 'medium';
          const isOwner = isItemOwner(ann, currentUser);

          return (
            <div
              key={ann.id}
              className="item-card"
              style={
                isHigh
                  ? {
                      borderColor: 'var(--aust-red-border)',
                      backgroundColor: 'var(--aust-red-light)'
                    }
                  : {}
              }
            >
              <div>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span
                      className={`badge ${
                        isHigh
                          ? 'badge-red'
                          : isMedium
                          ? 'badge-gold'
                          : 'badge-green'
                      }`}
                    >
                      {isHigh && <ShieldAlert size={12} />}
                      {ann.priority} Priority
                    </span>
                    {isOwner && (
                      <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                        Added by You
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Posted {formatToYYYYMMDD(ann.date)}
                  </span>
                </div>

                <h3
                  className="card-title"
                  style={isHigh ? { color: 'var(--aust-red-dark)' } : {}}
                >
                  {ann.title}
                </h3>

                <div className="card-body" style={{ marginTop: '0.6rem' }}>
                  <p style={{ whiteSpace: 'pre-line', fontSize: '0.88rem' }}>{ann.body}</p>

                  <div style={{ marginTop: '0.85rem' }}>
                    <div className="card-meta-row">
                      <User size={14} />
                      <span>{ann.posted_by}</span>
                    </div>

                    {ann.expires && (
                      <div className="card-meta-row">
                        <Calendar size={14} />
                        <span>Expires: <strong>{formatToYYYYMMDD(ann.expires)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="card-actions">
                  <button
                    className="btn-card-action"
                    onClick={() => onEdit('announcements', ann)}
                    title="Edit notice"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="btn-card-action danger"
                    onClick={() => onDelete('announcements', ann.id, ann.title)}
                    title="Remove notice"
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
    </div>
  );
}
