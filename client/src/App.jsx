import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import TabNavigation from './components/TabNavigation';
import ScheduleSection from './components/ScheduleSection';
import RoomSection from './components/RoomSection';
import EventSection from './components/EventSection';
import AnnouncementSection from './components/AnnouncementSection';
import AssignmentSection from './components/AssignmentSection';
import Modal from './components/Modal';
import ChatDrawer from './components/ChatDrawer';
import {
  fetchSchedules, createSchedule, updateSchedule, deleteSchedule,
  fetchRooms, createRoom, updateRoom, deleteRoom, bookRoom, cancelRoomBooking,
  fetchEvents, createEvent, updateEvent, deleteEvent, registerForEvent, cancelEventRegistration,
  fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  fetchAssignments, createAssignment, updateAssignment, deleteAssignment,
  resetAllData
} from './services/api';
import './App.css';
import { Bot } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('schedules');
  const [isChatOpen, setIsChatOpen] = useState(true);

  // 5 Systems State
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'schedules',
    initialData: null
  });

  // Load all 5 datasets
  const loadAllData = useCallback(async () => {
    try {
      const [sch, rm, ev, ann, asgn] = await Promise.all([
        fetchSchedules(),
        fetchRooms(),
        fetchEvents(),
        fetchAnnouncements(),
        fetchAssignments()
      ]);
      setSchedules(sch || []);
      setRooms(rm || []);
      setEvents(ev || []);
      setAnnouncements(ann || []);
      setAssignments(asgn || []);
    } catch (err) {
      console.error('Error loading campus data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Add/Edit Open
  const handleOpenAddModal = (tabType) => {
    setModalConfig({
      isOpen: true,
      type: tabType,
      initialData: null
    });
  };

  const handleOpenEditModal = (type, item) => {
    setModalConfig({
      isOpen: true,
      type,
      initialData: item
    });
  };

  // Handle Book Room Open
  const handleOpenBookModal = (room) => {
    setModalConfig({
      isOpen: true,
      type: 'bookRoom',
      initialData: room
    });
  };

  // Handle Register Event Open
  const handleOpenRegisterModal = (event) => {
    setModalConfig({
      isOpen: true,
      type: 'registerEvent',
      initialData: event
    });
  };

  const handleCloseModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Form Submit Handler
  const handleModalSubmit = async (formData) => {
    const { type, initialData } = modalConfig;
    handleCloseModal();

    try {
      if (type === 'schedules') {
        if (initialData?.id) {
          const updated = await updateSchedule(initialData.id, formData);
          setSchedules(prev => prev.map(s => s.id === initialData.id ? updated : s));
        } else {
          const created = await createSchedule(formData);
          setSchedules(prev => [created, ...prev]);
        }
      } else if (type === 'rooms') {
        if (initialData?.id) {
          const updated = await updateRoom(initialData.id, formData);
          setRooms(prev => prev.map(r => r.id === initialData.id ? updated : r));
        } else {
          const created = await createRoom(formData);
          setRooms(prev => [...prev, created]);
        }
      } else if (type === 'events') {
        if (initialData?.id) {
          const updated = await updateEvent(initialData.id, formData);
          setEvents(prev => prev.map(e => e.id === initialData.id ? updated : e));
        } else {
          const created = await createEvent(formData);
          setEvents(prev => [created, ...prev]);
        }
      } else if (type === 'announcements') {
        if (initialData?.id) {
          const updated = await updateAnnouncement(initialData.id, formData);
          setAnnouncements(prev => prev.map(a => a.id === initialData.id ? updated : a));
        } else {
          const created = await createAnnouncement(formData);
          setAnnouncements(prev => [created, ...prev]);
        }
      } else if (type === 'assignments') {
        if (initialData?.id) {
          const updated = await updateAssignment(initialData.id, formData);
          setAssignments(prev => prev.map(a => a.id === initialData.id ? updated : a));
        } else {
          const created = await createAssignment(formData);
          setAssignments(prev => [created, ...prev]);
        }
      } else if (type === 'bookRoom') {
        await bookRoom(initialData.id, formData);
        await loadAllData();
      } else if (type === 'registerEvent') {
        await registerForEvent(initialData.id, formData);
        await loadAllData();
      }
    } catch (err) {
      alert(`Error saving: ${err.message}`);
    }
  };

  // Delete Handler
  const handleDelete = async (type, id, label) => {
    if (!window.confirm(`Are you sure you want to delete ${label || 'this item'}?`)) return;

    try {
      if (type === 'schedules') {
        await deleteSchedule(id);
        setSchedules(prev => prev.filter(x => x.id !== id));
      } else if (type === 'rooms') {
        await deleteRoom(id);
        setRooms(prev => prev.filter(x => x.id !== id));
      } else if (type === 'events') {
        await deleteEvent(id);
        setEvents(prev => prev.filter(x => x.id !== id));
      } else if (type === 'announcements') {
        await deleteAnnouncement(id);
        setAnnouncements(prev => prev.filter(x => x.id !== id));
      } else if (type === 'assignments') {
        await deleteAssignment(id);
        setAssignments(prev => prev.filter(x => x.id !== id));
      }
    } catch (err) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  // Cancel Room Booking
  const handleCancelBooking = async (roomId, bookingId) => {
    if (!window.confirm('Cancel this room booking?')) return;
    try {
      await cancelRoomBooking(roomId, bookingId);
      await loadAllData();
    } catch (err) {
      alert(`Error cancelling booking: ${err.message}`);
    }
  };

  // Cancel Event Registration
  const handleCancelRegistration = async (eventId, studentId) => {
    if (!window.confirm(`Remove attendee ${studentId}?`)) return;
    try {
      await cancelEventRegistration(eventId, studentId);
      await loadAllData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Reset all data to initial seed
  const handleResetSeed = async () => {
    await resetAllData();
    await loadAllData();
  };

  const counts = {
    schedules: schedules.length,
    rooms: rooms.length,
    events: events.length,
    announcements: announcements.length,
    assignments: assignments.length
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        onResetSeed={handleResetSeed}
      />

      {/* Main Split Layout */}
      <main className="main-content">
        {/* Left/Main: Campus Data Manager */}
        <section className="dashboard-panel">
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            counts={counts}
            onOpenAddModal={handleOpenAddModal}
          />

          {activeTab === 'schedules' && (
            <ScheduleSection
              schedules={schedules}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomSection
              rooms={rooms}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              onOpenBookModal={handleOpenBookModal}
              onCancelBooking={handleCancelBooking}
            />
          )}

          {activeTab === 'events' && (
            <EventSection
              events={events}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              onOpenRegisterModal={handleOpenRegisterModal}
              onCancelRegistration={handleCancelRegistration}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementSection
              announcements={announcements}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentSection
              assignments={assignments}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          )}
        </section>

        {/* Right Dock: AI Senior Assistant */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onDataChanged={loadAllData}
        />
      </main>

      {/* Floating Action Button when chat drawer is closed */}
      {!isChatOpen && (
        <button
          className="chat-toggle-fab"
          onClick={() => setIsChatOpen(true)}
        >
          <Bot size={20} />
          <span>Ask CampusOS AI</span>
        </button>
      )}

      {/* Universal Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        type={modalConfig.type}
        initialData={modalConfig.initialData}
      />
    </div>
  );
}
