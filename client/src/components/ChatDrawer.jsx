import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Trash2, X, Sparkles, Loader2 } from 'lucide-react';
import ToolCallPill from './ToolCallPill';
import { sendAgentMessage } from '../services/api';
import './ChatDrawer.css';

export default function ChatDrawer({ isOpen, onClose, onDataChanged }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "👋 Hi! I'm your **CampusOS Senior Assistant** at AUST.\n\nI have direct live access to your class schedules, room bookings, campus events, assignments, and urgent announcements. How can I help you today?",
      time: 'Just now',
      toolCalls: []
    }
  ]);

  const messagesEndRef = useRef(null);

  const sampleQueries = [
    'When is my next class?',
    'What classes do I have on Wednesday?',
    'What assignments do I have due this week?',
    'Show me all high priority announcements.',
    'I am free until 2 — is there anything on campus I could drop into?',
    'Which labs have a projector and can fit at least 30 people?',
    'Book Room 7A02 tomorrow from 3 PM to 5 PM.',
    'Just book me any room tomorrow afternoon.'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await sendAgentMessage(userMsg.text, messages);
      const assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.text || 'I checked the campus records for you.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: response.toolCalls || []
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If a mutating tool was called (e.g. book_room, register_for_event), notify parent dashboard to re-fetch
      if (response.toolCalls && response.toolCalls.some(t => ['book_room', 'cancel_room_booking', 'register_for_event', 'cancel_event_registration'].includes(t.tool || t.name))) {
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: '⚠️ Unable to connect to the backend agent server. Please make sure the backend is running.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolCalls: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: "👋 Conversation history cleared. What else would you like to look up?",
          time: 'Just now',
          toolCalls: []
        }
      ]);
    }
  };

  const renderFormattedText = (txt) => {
    if (!txt) return null;
    // Simple markdown-style renderer: replace **text** with <strong>text</strong> and \n with <br />
    const parts = txt.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  return (
    <aside className={`chat-panel-container ${isOpen ? '' : 'collapsed'}`}>
      <div className="chat-drawer">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-bot-profile">
            <div className="bot-avatar">
              <Bot size={20} />
            </div>
            <div className="bot-meta">
              <h4>CampusOS Senior AI</h4>
              <span>
                <Sparkles size={11} />
                Real-Time Tool Calling Active
              </span>
            </div>
          </div>

          <div className="chat-header-actions">
            <button className="btn-icon-header" onClick={handleClear} title="Clear conversation">
              <Trash2 size={16} />
            </button>
            <button className="btn-icon-header" onClick={onClose} title="Close Assistant panel">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Queries Test Chips */}
        <div className="quick-queries-container">
          <div className="quick-queries-label">Judge Sample Test Queries (1-Click):</div>
          <div className="chips-scroll">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                className="query-chip"
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble ${msg.sender}`}>
              {/* Tool Calls Inspector Pills */}
              {msg.toolCalls && msg.toolCalls.map((tc, tcIdx) => (
                <ToolCallPill key={tcIdx} toolCall={tc} />
              ))}

              <div className="bubble-body">
                {renderFormattedText(msg.text)}
              </div>
              <span className="message-time">{msg.time}</span>
            </div>
          ))}

          {loading && (
            <div className="message-bubble assistant">
              <div className="bubble-body" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Loader2 size={16} className="spin" />
                <span>Reading live campus data & reasoning...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form
          className="chat-input-container"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            className="chat-input"
            type="text"
            placeholder="Ask anything about schedules, rooms, events..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
