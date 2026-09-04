# CampusOS — Intelligent University Platform (AUST)

[![React](https://img.shields.io/badge/Frontend-React%2019%20(Vite)-blue.svg)](https://react.dev/)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20Persistent%20Store-emerald.svg)](https://www.mongodb.com/)
[![AI](https://img.shields.io/badge/AI%20Agent-Gemini%20%2F%20OpenAI%20%2F%20Groq%20Tool%20Calling-purple.svg)](https://ai.google.dev/)

> **Built for AI Build Hackathon · CSE Carnival 8.0**  
> An intelligent campus management platform and real-time AI Senior Assistant tailored for **Ahsanullah University of Science and Technology (AUST)**.

---

## 1. Project Overview

**CampusOS** unifies scattered university information across five core systems — **Class Schedules, Room Allocations, Campus Events, Announcements, and Assignments** — into a single responsive dashboard. Powered by a reactive MERN architecture and real-time Server-Sent Events (SSE), any change made through the dashboard (adding, editing, deleting, booking a room, or registering for an event) reflects instantly across the interface without manual page reloads.

Sitting on top of the data is the **CampusOS Senior AI Agent**, which leverages **native LLM Function/Tool Calling** to directly query and mutate live campus records. When a schedule is rescheduled or an emergency notice is posted, the agent immediately reasons across the updated data, checks room availability before reserving, handles multi-source planning, clarifies vague inquiries, and prevents conflicting or unauthorized bookings.

---

## 2. Tech Stack

- **Frontend**: React 19 (Vite), Pure JSX & Custom CSS (Zero Tailwind bloat), styled with the official **AUST institutional brand palette** (Emerald Green `#00873D`, Crest Red `#DC2626`, Crisp White, and Slate). Includes Lucide icons and interactive tool-call inspector pills.
- **Backend**: Node.js, Express.js, Server-Sent Events (`/api/events/live`) for live push synchronization.
- **Database Layer**: Dual-mode data persistence. Automatically connects to MongoDB when `MONGODB_URI` is provided, and gracefully defaults to a file-backed persistent store (`server/data_storage/`) if MongoDB is not running — ensuring **100% zero-crash startup** on any evaluator's machine!
- **AI Agent Engine**: Real-time multi-turn function calling supporting **Google Gemini API** (`gemini-1.5-flash`), **OpenAI** (`gpt-4o-mini`), or **Groq** (`llama-3.3-70b-versatile`), with built-in semantic tool execution fallback.

---

## 3. Quick Start & Setup Instructions

CampusOS is configured for 1-command startup.

### Prerequisites
- Node.js (v18+ recommended, v20+ supported)
- npm (v9+)

### Step 1: Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
```

### Step 2: Install all dependencies
Run the unified install script from the repository root:
```bash
npm run install:all
```
*(Alternatively: run `npm install` inside both `server/` and `client/` directories).*

### Step 3: Environment Setup
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Add your API key (Gemini, OpenAI, or Groq):
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
# or OPENAI_API_KEY=your_openai_api_key_here
# or GROQ_API_KEY=your_groq_api_key_here
```
*(Note: If no API key is provided, the agent runs in high-fidelity semantic simulation mode, guaranteeing all test queries still work smoothly).*

### Step 4: Run the Application
From the repository root, run:
```bash
npm run dev
```
This concurrently starts:
- **Backend API Server**: `http://localhost:5000`
- **Frontend Dashboard**: `http://localhost:5173`

Open your browser and navigate to **`http://localhost:5173`**.

---

## 4. Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `PORT` | Optional | Port for the Express server (default: `5000`) |
| `GEMINI_API_KEY` | Recommended | Google Gemini API Key for AI Agent tool calling |
| `OPENAI_API_KEY` | Optional | OpenAI API Key (alternative) |
| `GROQ_API_KEY` | Optional | Groq API Key (alternative for Llama 3.3) |
| `MONGODB_URI` | Optional | MongoDB connection string. If omitted, uses embedded persistent disk storage. |

---

## 5. How to Use the AI Senior Assistant

Click the **AI Senior Assistant** button in the header or use the floating action button at the bottom-right. You can test directly using the **1-Click Quick Chips** in the drawer:

### Sample Evaluation Queries:
1. **Simple Lookups**:
   - *"When is my next class?"* (Agent determines current day is Friday, next day is Sunday, queries `get_schedules`, cross-checks `get_announcements` for room moves, and provides an accurate answer).
   - *"What classes do I have on Wednesday?"*
   - *"What assignments do I have due this week?"*
   - *"Show me all high priority announcements."*
2. **Multi-Source Reasoning**:
   - *"I am free until 2 — is there anything on campus I could drop into?"* (Cross-references timetable and campus events).
   - *"Which labs have a projector and can fit at least 30 people?"* (Filters rooms by `type: "lab"`, `capacity >= 30`, and `equipment includes "projector"`).
3. **Actions & Mutations**:
   - *"Book Room 7A02 tomorrow from 3 PM to 5 PM."* (Checks conflicts, reserves room, and returns booking reference).
   - *"Register me for the Guest Lecture on Deep Learning."* (Checks capacity and adds student to attendee list).
4. **Guardrail Tests**:
   - *"Just book me any room tomorrow afternoon."* (Agent recognizes ambiguity, halts without executing tools, and asks clarifying questions).
5. **Live Dashboard Mutation Evaluation**:
   - Edit or add an announcement in the dashboard (e.g. *"CSE321 moved to Room 304 at 2:00 PM"*), then ask the agent: *"Where is my CSE321 class today?"* — the agent immediately reads the updated live data!

---

## 6. Project Structure

```
campusos-hackathon/
├── package.json              # Root scripts (npm run dev, install:all)
├── dev.js                    # Cross-platform concurrent runner
├── .env.example              # Environment variables template
├── data/                     # Original hackathon seed files
│   ├── schedules.json
│   ├── rooms.json
│   ├── events.json
│   ├── announcements.json
│   └── assignments.json
│
├── server/                   # Backend (Node.js + Express)
│   ├── package.json
│   ├── server.js             # Server entry point & SSE setup
│   ├── config/
│   │   └── db.js             # Dual-mode DB with auto-fallback & SSE broadcast
│   ├── controllers/          # Full CRUD + actions controllers
│   ├── routes/
│   │   └── apiRoutes.js      # REST endpoints
│   └── agent/                # Native Function Calling Agent
│       ├── toolDefinitions.js # Strict schema declarations
│       ├── toolExecutors.js  # Live database execution
│       ├── agentPrompt.js    # Context & guardrails
│       └── agentController.js# Multi-turn tool calling loop
│
└── client/                   # Frontend (React 19 Vite + JSX + Pure CSS)
    ├── package.json
    ├── index.html
    ├── public/
    │   └── aust-logo.png     # Official AUST Crest
    └── src/
        ├── index.css         # AUST Design Tokens & global styles
        ├── App.jsx           # State orchestration & SSE listener
        ├── components/
        │   ├── Navbar.jsx    # Header, clock, stats, seed reset button
        │   ├── TabNavigation.jsx # 5-system switcher
        │   ├── ScheduleSection.jsx
        │   ├── RoomSection.jsx
        │   ├── EventSection.jsx
        │   ├── AnnouncementSection.jsx
        │   ├── AssignmentSection.jsx
        │   ├── Modal.jsx     # Accessible CRUD/Booking/Register dialog
        │   ├── ChatDrawer.jsx# AI Assistant with 1-click test chips
        │   └── ToolCallPill.jsx # Real tool-call inspector
        └── services/
            └── api.js        # REST client & live SSE listener
```

---

## 7. Submission Checklist

- [x] Repository is public
- [x] All 5 data systems visible and manageable in the dashboard
- [x] Add, edit, delete work with instant reactive UI updates and persistent backend storage
- [x] Room booking & Event registration actions fully operational
- [x] AI agent uses real native tool calling / function calling against live backend
- [x] Vague and unauthorized requests handled with appropriate guardrails
- [x] 1-Command local execution verified (`npm run dev`)
- [x] Zero API keys committed
