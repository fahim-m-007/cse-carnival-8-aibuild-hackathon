import React from 'react';
import { Calendar, DoorOpen, PartyPopper, Bell, FileText, Plus } from 'lucide-react';
import './TabNavigation.css';

export default function TabNavigation({
  activeTab,
  setActiveTab,
  counts,
  onOpenAddModal
}) {
  const tabs = [
    { id: 'schedules', label: 'Class Schedule', icon: Calendar, count: counts.schedules, addLabel: 'Add Class' },
    { id: 'rooms', label: 'Rooms & Bookings', icon: DoorOpen, count: counts.rooms, addLabel: 'Add Room' },
    { id: 'events', label: 'Campus Events', icon: PartyPopper, count: counts.events, addLabel: 'Create Event' },
    { id: 'announcements', label: 'Announcements', icon: Bell, count: counts.announcements, addLabel: 'Post Notice' },
    { id: 'assignments', label: 'Assignments', icon: FileText, count: counts.assignments, addLabel: 'Add Assignment' }
  ];

  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="tab-navigation-container">
      <div className="tab-list">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
              <span className="tab-badge">{tab.count}</span>
            </button>
          );
        })}
      </div>

      <button className="primary-add-btn" onClick={() => onOpenAddModal(activeTab)}>
        <Plus size={16} />
        <span>{currentTabObj.addLabel}</span>
      </button>
    </div>
  );
}
