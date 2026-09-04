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
import AuthPage from './components/AuthPage';
import DashboardSection from './components/DashboardSection';
import { getCurrentUser, logoutUser } from './services/auth';
import {
  fetchSchedules, createSchedule, updateSchedule, deleteSchedule,
  fetchRooms, createRoom, updateRoom, deleteRoom, bookRoom, cancelRoomBooking,
  fetchEvents, createEvent, updateEvent, deleteEvent, registerForEvent, cancelEventRegistration,
  fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  fetchAssignments, createAssignment, updateAssignment, deleteAssignment,
  resetAllData, subscribeToLiveUpdates
} from './services/api';
import './App.css';
import { Bot } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
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
    const unsubscribe = subscribeToLiveUpdates(() => {
      loadAllData();
    });
    return () => unsubscribe();
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

    try {
      if (type === 'schedules') {
        if (initialData?.id) {
          const updated = await updateSchedule(initialData.id, formData, currentUser);
          setSchedules(prev => prev.map(s => s.id === initialData.id ? updated : s));
        } else {
          const created = await createSchedule(formData, currentUser);
          setSchedules(prev => [created, ...prev]);
        }
      } else if (type === 'rooms') {
        if (initialData?.id) {
          const updated = await updateRoom(initialData.id, formData, currentUser);
          setRooms(prev => prev.map(r => r.id === initialData.id ? updated : r));
        } else {
          const created = await createRoom(formData, currentUser);
          setRooms(prev => [...prev, created]);
        }
      } else if (type === 'events') {
        if (initialData?.id) {
          const updated = await updateEvent(initialData.id, formData, currentUser);
          setEvents(prev => prev.map(e => e.id === initialData.id ? updated : e));
        } else {
          const created = await createEvent(formData, currentUser);
          setEvents(prev => [created, ...prev]);
        }
      } else if (type === 'announcements') {
        if (initialData?.id) {
          const updated = await updateAnnouncement(initialData.id, formData, currentUser);
          setAnnouncements(prev => prev.map(a => a.id === initialData.id ? updated : a));
        } else {
          const created = await createAnnouncement(formData, currentUser);
          setAnnouncements(prev => [created, ...prev]);
        }
      } else if (type === 'assignments') {
        if (initialData?.id) {
          const updated = await updateAssignment(initialData.id, formData, currentUser);
          setAssignments(prev => prev.map(a => a.id === initialData.id ? updated : a));
        } else {
          const created = await createAssignment(formData, currentUser);
          setAssignments(prev => [created, ...prev]);
        }
      } else if (type === 'bookRoom') {
        await bookRoom(initialData.id, formData, currentUser);
        await loadAllData();
      } else if (type === 'registerEvent') {
        await registerForEvent(initialData.id, formData);
        await loadAllData();
      }
      handleCloseModal();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  // Delete Handler
  const handleDelete = async (type, id, label) => {
    if (!window.confirm(`Are you sure you want to delete ${label || 'this item'}?`)) return;

    try {
      if (type === 'schedules') {
        await deleteSchedule(id, currentUser);
        setSchedules(prev => prev.filter(x => x.id !== id));
      } else if (type === 'rooms') {
        await deleteRoom(id, currentUser);
        setRooms(prev => prev.filter(x => x.id !== id));
      } else if (type === 'events') {
        await deleteEvent(id, currentUser);
        setEvents(prev => prev.filter(x => x.id !== id));
      } else if (type === 'announcements') {
        await deleteAnnouncement(id, currentUser);
        setAnnouncements(prev => prev.filter(x => x.id !== id));
      } else if (type === 'assignments') {
        await deleteAssignment(id, currentUser);
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
      await cancelRoomBooking(roomId, bookingId, currentUser);
      await loadAllData();
    } catch (err) {
      alert(`Error cancelling booking: ${err.message}`);
    }
  };

  // Cancel Event Registration
  const handleCancelRegistration = async (eventId, studentId) => {
    if (!window.confirm(`Cancel your event registration (${studentId})?`)) return;
    try {
      await cancelEventRegistration(eventId, studentId, currentUser);
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

  // Logout Handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of CampusOS?')) {
      logoutUser();
      setCurrentUser(null);
    }
  };

  // Auth gate: If user is not logged in, render the Login/Sign Up page first
  if (!currentUser) {
    return <AuthPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

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
        currentUser={currentUser}
        onLogout={handleLogout}
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

          {activeTab === 'dashboard' && (
            <DashboardSection
              currentUser={currentUser}
              schedules={schedules}
              rooms={rooms}
              events={events}
              announcements={announcements}
              assignments={assignments}
              onNavigate={setActiveTab}
              onCancelRegistration={handleCancelRegistration}
              onCancelBooking={handleCancelBooking}
            />
          )}

          {activeTab === 'schedules' && (
            <ScheduleSection
              schedules={schedules}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomSection
              rooms={rooms}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              onOpenBookModal={handleOpenBookModal}
              onCancelBooking={handleCancelBooking}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'events' && (
            <EventSection
              events={events}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              onOpenRegisterModal={handleOpenRegisterModal}
              onCancelRegistration={handleCancelRegistration}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementSection
              announcements={announcements}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentSection
              assignments={assignments}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              currentUser={currentUser}
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
        currentUser={currentUser}
      />
    </div>
  );
}
