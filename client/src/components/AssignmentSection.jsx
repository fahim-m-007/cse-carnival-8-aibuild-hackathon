import React, { useState } from 'react';
import { Search, Calendar, FileText, UploadCloud, Award, Edit2, Trash2 } from 'lucide-react';
import { isItemOwner, formatToYYYYMMDD } from '../services/api';
import './SectionCommon.css';

export default function AssignmentSection({
  assignments,
  onEdit,
  onDelete,
  currentUser = null
}) {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const statuses = ['All', 'pending', 'submitted', 'graded', 'late'];

  const filtered = assignments.filter((asgn) => {
    const matchStatus = selectedStatus === 'All' || asgn.status === selectedStatus;
    const matchSearch =
      asgn.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asgn.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asgn.course_title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="section-wrapper">
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search course, assignment title..."
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
        {filtered.map((asgn) => {
          const isPending = asgn.status === 'pending';
          const isSubmitted = asgn.status === 'submitted';
          const isGraded = asgn.status === 'graded';
          const isLate = asgn.status === 'late';
          const isOwner = isItemOwner(asgn, currentUser);

          return (
            <div key={asgn.id} className="item-card">
              <div>
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-green">
                        {asgn.course}
                      </span>
                      {isOwner && (
                        <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                          Added by You
                        </span>
                      )}
                    </div>
                    <h3 className="card-title">{asgn.title}</h3>
                    <div className="card-subtitle">{asgn.course_title}</div>
                  </div>

                  <span
                    className={`badge ${
                      isSubmitted
                        ? 'badge-green'
                        : isPending
                        ? 'badge-blue'
                        : isGraded
                        ? 'badge-purple'
                        : 'badge-red'
                    }`}
                  >
                    {asgn.status}
                  </span>
                </div>

                <div className="card-body">
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', marginBottom: '0.85rem' }}>
                    {asgn.description}
                  </p>

                  <div className="card-meta-row">
                    <Calendar size={15} />
                    <span>
                      Deadline: <strong style={{ color: 'var(--aust-red)' }}>{formatToYYYYMMDD(asgn.deadline)}</strong>
                    </span>
                  </div>

                  <div className="card-meta-row">
                    <UploadCloud size={15} />
                    <span>Platform: <strong>{asgn.submission_platform}</strong></span>
                  </div>

                  <div className="card-meta-row">
                    <Award size={15} />
                    <span>Carries: <strong>{asgn.marks} marks</strong></span>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="card-actions">
                  <button
                    className="btn-card-action"
                    onClick={() => onEdit('assignments', asgn)}
                    title="Edit assignment"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="btn-card-action danger"
                    onClick={() => onDelete('assignments', asgn.id, asgn.title)}
                    title="Delete assignment"
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
