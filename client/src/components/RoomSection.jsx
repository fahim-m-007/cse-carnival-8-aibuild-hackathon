import React, { useState } from 'react';
import { Search, Users, Wrench, Calendar, PlusCircle, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import './SectionCommon.css';

export default function RoomSection({
  rooms,
  onEdit,
  onDelete,
  onOpenBookModal,
  onCancelBooking
}) {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const types = ['All', 'classroom', 'lab', 'seminar'];
  const equipmentOptions = ['All', 'projector', 'AC', 'whiteboard', 'smart board'];

  const filtered = rooms.filter((room) => {
    const matchType = selectedType === 'All' || room.type === selectedType;
    const matchEquip =
      selectedEquipment === 'All' ||
      (room.equipment && room.equipment.includes(selectedEquipment));
    const matchSearch =
      room.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchEquip && matchSearch;
  });

  return (
    <div className="section-wrapper">
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search room number (e.g. 7A02, 7B05)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-pills">
            {types.map((type) => (
              <button
                key={type}
                className={`filter-pill ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Equip:</span>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
            >
              {equipmentOptions.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cards-grid">
        {filtered.map((room) => {
          const bookings = room.bookings || [];
          const isAvailable = room.status === 'available';

          return (
            <div key={room.id} className="item-card">
              <div>
                <div className="card-header">
                  <div>
                    <span
                      className={`badge ${
                        room.type === 'lab'
                          ? 'badge-blue'
                          : room.type === 'seminar'
                          ? 'badge-purple'
                          : 'badge-green'
                      }`}
                      style={{ marginBottom: '0.35rem' }}
                    >
                      {room.type}
                    </span>
                    <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
                      Room {room.room_number}
                    </h3>
                    <div className="card-subtitle">Floor {room.floor}</div>
                  </div>

                  <span className={`badge ${isAvailable ? 'badge-green' : 'badge-red'}`}>
                    {isAvailable ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {room.status}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-meta-row">
                    <Users size={15} />
                    <span>Capacity: <strong>{room.capacity} seats</strong></span>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Equipment:
                    </div>
                    <div className="chips-list">
                      {room.equipment?.map((eq, i) => (
                        <span key={i} className="tag-chip">{eq}</span>
                      ))}
                    </div>
                  </div>

                  {/* Active Bookings Sub-list */}
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-title)' }}>
                        Bookings ({bookings.length})
                      </span>
                    </div>

                    {bookings.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No active bookings.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '90px', overflowY: 'auto' }}>
                        {bookings.map((b) => (
                          <div
                            key={b.booking_id}
                            style={{
                              fontSize: '0.76rem',
                              background: '#F8FAFC',
                              padding: '0.35rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <div>
                              <strong>{b.date}</strong> ({b.start_time}–{b.end_time})
                              <div style={{ color: 'var(--text-muted)' }}>{b.booked_by} · {b.purpose}</div>
                            </div>
                            <button
                              onClick={() => onCancelBooking(room.id, b.booking_id)}
                              style={{ color: 'var(--aust-red)', padding: '2px', marginLeft: '6px' }}
                              title="Cancel this booking"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="btn-card-action primary"
                  onClick={() => onOpenBookModal(room)}
                  title="Reserve this room"
                >
                  <PlusCircle size={13} />
                  <span>Book Room</span>
                </button>

                <button
                  className="btn-card-action"
                  onClick={() => onEdit('rooms', room)}
                  title="Edit room"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>

                <button
                  className="btn-card-action danger"
                  onClick={() => onDelete('rooms', room.id, `Room ${room.room_number}`)}
                  title="Delete room"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
