import React, { useState } from 'react';
import { RotateCcw, Bot, Calendar, Sparkles } from 'lucide-react';
import './Navbar.css';

export default function Navbar({
  isChatOpen,
  setIsChatOpen,
  onResetSeed,
  currentTime = 'Friday, 4 Sep 2026 · 15:45'
}) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset all 5 datasets back to initial hackathon seed data?')) {
      setResetting(true);
      await onResetSeed();
      setTimeout(() => setResetting(false), 500);
    }
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <img
          src="/aust-logo.png"
          alt="AUST Logo"
          className="nav-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="brand-info">
          <div className="brand-title">
            Campus<span>OS</span>
          </div>
          <div className="brand-subtitle">AUST Intelligent University Platform</div>
        </div>
      </div>

      <div className="nav-center">
        <div className="time-widget" title="Simulated Campus Context Time">
          <div className="live-pulse"></div>
          <Calendar size={14} />
          <span>{currentTime}</span>
        </div>
      </div>

      <div className="nav-actions">
        <button
          className="btn-seed-reset"
          onClick={handleReset}
          disabled={resetting}
          title="Reset database to initial JSON seed state"
        >
          <RotateCcw size={14} className={resetting ? 'spin' : ''} />
          <span>{resetting ? 'Resetting...' : 'Reset Seed Data'}</span>
        </button>

        <button
          className={`btn-chat-toggle ${isChatOpen ? 'active' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <Bot size={16} />
          <span>AI Senior Assistant</span>
        </button>
      </div>
    </header>
  );
}
