# CampusOS — Intelligent University Platform (AUST)

[![React](https://img.shields.io/badge/Frontend-React%2019%20(Vite)-blue.svg)](https://react.dev/)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas%20%2B%20Mongoose-emerald.svg)](https://www.mongodb.com/)
[![AI](https://img.shields.io/badge/AI%20Agent-Gemini%20%2F%20OpenAI%20%2F%20Groq%20Tool%20Calling-purple.svg)](https://ai.google.dev/)

> **Built for the AI Build Hackathon · CSE Carnival 8.0**  
> An intelligent campus management platform and real-time AI Senior Assistant tailored for **Ahsanullah University of Science and Technology (AUST)**.

---

## 1. Project Overview

**CampusOS** is an intelligent university platform that unifies scattered campus data across five core systems — **Class Schedules, Room Allocations, Campus Events, Urgent Announcements, and Assignments** — into a unified, live-synced student dashboard powered by an autonomous **AI Senior Assistant**. Built with a modern MERN stack (MongoDB Atlas + Express + React 19 + Node.js) and real-time Server-Sent Events (SSE), any record added, edited, deleted, room booked, or event registered by a student persists immediately to the database and syncs across all open interfaces without page reloads. Sitting directly on top of the live data, the AI Senior Assistant leverages **native LLM tool calling** to query schedules, inspect room availability, book rooms, register for events, cross-reference multi-source inquiries, request clarification on ambiguous prompts, and refuse unauthorized operations.

---

## 2. Tech Stack

- **Languages**: JavaScript (ES2024+, Node.js, React JSX).
- **Frontend Framework**: React 19, Vite, Pure Handcrafted CSS (Zero Tailwind bloat, official **AUST institutional brand palette**: Forest Green `#00873D`, Crest Red `#DC2626`, Crisp White `#FFFFFF`, and Slate `#1E293B`), Lucide React icons.
- **Backend Framework**: Node.js, Express.js, Server-Sent Events (`/api/events/live`) for real-time bidirectional push updates.
- **Database**: **MongoDB Atlas** via **Mongoose** models (`User`, `Schedule`, `Room`, `Event`, `Announcement`, `Assignment`), featuring an automatic zero-crash fallback to embedded storage if MongoDB is ever offline on an evaluator's machine.
- **LLM / AI Engine**: Multi-turn Function Calling / Tool Calling supporting **Google Gemini API** (`gemini-1.5-flash` via `@google/generative-ai`), **OpenAI** (`gpt-4o-mini`), or **Groq** (`llama-3.3-70b-versatile`), with built-in semantic fallback execution.

---

## 3. Setup Instructions

Follow these exact commands to install dependencies and run CampusOS locally:

### Prerequisites
- **Node.js**: v18.0.0 or newer (v20+ / v22+ tested)
- **npm**: v9.0.0 or newer

### Step 1: Clone the Repository
```bash
git clone https://github.com/fahim-m-007/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
```

### Step 2: Install Dependencies
Run the unified install command from the root directory to install both server and client packages:
```bash
npm run install:all
```
*(Alternatively, run `npm install` inside both `server/` and `client/` folders).*

### Step 3: Configure Environment Variables
Create your local `.env` file from the provided template:
```bash
cp .env.example .env
```
*(On Windows PowerShell, you can run: `Copy-Item .env.example .env`)*

Add your Gemini, OpenAI, or Groq API key (see [Section 4](#4-environment-variables) for details).

### Step 4: Build the Client
Compile the production frontend bundle:
```bash
npm --prefix client run build
```

### Step 5: Start the Application
Run the concurrent dev command from the root directory:
```bash
npm run dev
```

This automatically checks and frees ports, then launches:
- **Backend API Server**: `http://localhost:5000`
- **Frontend Dashboard**: `http://localhost:5173` (and also served directly on `http://localhost:5000`)

Open your browser and navigate to **`http://localhost:5173`** or **`http://localhost:5000`**.

---

## 4. Environment Variables

All configuration is managed through the root `.env` file. A complete template is provided in [`.env.example`](./.env.example).

> [!CAUTION]
> **Security Notice**: Do NOT commit real API keys or credentials to the repository. The `.env` file is excluded from Git via `.gitignore`.

| Environment Variable | Required | Description | Example Value |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Port for the Express backend server (default: `5000`) | `5000` |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for real AI Agent tool calling | `AIzaSyD...` |
| `OPENAI_API_KEY` | Optional | OpenAI API key (alternative LLM provider) | `sk-proj-...` |
| `GROQ_API_KEY` | Optional | Groq API key for LLaMA 3.3 70B function calling | `gsk_...` |
| `MONGODB_URI` | Optional | MongoDB Atlas connection URI. If omitted, uses embedded persistent storage. | `mongodb+srv://campus_os:...@cluster0...` |

---

## 5. How to Use the Agent

Open the **AI Senior Assistant** drawer by clicking the button in the top-right navbar or the floating chat button in the bottom-right corner. You can type any campus inquiry or test with the **1-Click Suggestion Chips**.

### Types of Questions to Ask:

1. **Simple Lookups & Timetable Inquiries**:
   - *"When is my next class?"* — The agent detects the current day (Friday), determines the next active class day (Sunday), queries schedules, and cross-checks for moved classes.
   - *"What classes do I have on Wednesday?"*
   - *"What assignments do I have due this week?"*
   - *"Show me all high priority announcements."*

2. **Multi-Source Reasoning (Schedule + Events + Rooms)**:
   - *"I am free until 2 — is there anything on campus I could drop into?"* — Cross-references the student's timetable gaps against ongoing campus events.
   - *"Which labs have a projector and can fit at least 30 people?"* — Filters rooms by `type: "lab"`, `capacity >= 30`, and `equipment: ["projector"]`.

3. **Direct Action & Database Mutations (Tool Calling)**:
   - *"Book Room 7A02 tomorrow from 3 PM to 5 PM."* — Validates availability, verifies against class routines and existing bookings, and reserves the room with a booking ID.
   - *"Register me for the Guest Lecture on Deep Learning."* — Checks capacity, adds the student's ID and name to the event's attendee list in MongoDB Atlas, and increments the count.
   - *"Cancel my registration for evt-001."* — Cancels and updates the database in real time.

4. **Guardrails & Clarifications**:
   - *"Just book me any room tomorrow afternoon."* — The agent recognizes the request is underspecified, halts execution without calling tools, and politely asks for the exact time slot and room size.
   - Unauthorized attempts to delete other students' registrations or double-book occupied rooms are gracefully rejected.

5. **Live Synchronization Test**:
   - Reschedule a class or post a new announcement in the dashboard (e.g., *"CSE 4113 moved to Room 7A04 at 2:00 PM"*).
   - Immediately ask the agent: *"Where is my CSE 4113 class today?"* — the agent reflects the new live change instantly without refreshing!

---

## 6. Project Architecture

```
cse-carnival-8-aibuild-hackathon/
├── .env.example              # Environment variables template
├── package.json              # Root orchestration scripts
├── dev.js                    # Cross-platform runner with port management
├── PROBLEM_STATEMENT.md      # Official Hackathon Challenge Brief
│
├── server/                   # Backend (Node.js + Express + Mongoose)
│   ├── server.js             # API entrypoint, static server & SSE routes
│   ├── config/
│   │   └── db.js             # MongoDB Atlas connection & SSE broadcaster
│   ├── models/               # Mongoose schemas (User, Schedule, Room, Event, ...)
│   ├── controllers/          # Business logic (auth, events, rooms, schedules, ...)
│   ├── routes/               # Express REST API routes
│   └── agent/                # Native Function Calling AI Senior Assistant
│       ├── toolDefinitions.js# Strict JSON function declarations
│       ├── toolExecutors.js  # Live database mutation & query execution
│       ├── agentPrompt.js    # System instructions & institutional persona
│       └── agentController.js# Multi-turn tool calling loop
│
└── client/                   # Frontend (React 19 + Vite + Handcrafted CSS)
    ├── src/
    │   ├── App.jsx           # Main layout, live SSE sync & modal manager
    │   ├── components/
    │   │   ├── Navbar.jsx    # AUST header, clock, profile badge, seed reset
    │   │   ├── TabNavigation.jsx # 6-tab navigation (Dashboard, Schedule, ...)
    │   │   ├── DashboardSection.jsx # Student Dashboard connected to MongoDB
    │   │   ├── ScheduleSection.jsx  # Routine viewer & editor
    │   │   ├── RoomSection.jsx      # Room list & booking manager
    │   │   ├── EventSection.jsx     # Campus events & registration
    │   │   ├── AnnouncementSection.jsx # Notice board with priority badges
    │   │   ├── AssignmentSection.jsx   # Coursework deadline tracker
    │   │   ├── AuthPage.jsx         # Institutional Login & Sign Up
    │   │   ├── Modal.jsx            # Dynamic CRUD modal dialog
    │   │   ├── ChatDrawer.jsx       # Interactive AI Senior Assistant
    │   │   └── ToolCallPill.jsx     # Real-time function call inspector
    │   └── services/
    │       ├── api.js        # Backend HTTP client & SSE listener
    │       └── auth.js       # Student authentication service
    └── dist/                 # Optimized production bundle
```

---

## 7. Submission Verification Checklist

- [x] **1. Project Overview**: Clear one-paragraph explanation of architecture and workflow.
- [x] **2. Tech Stack**: Exhaustive listing of languages, frameworks, database, and LLMs.
- [x] **3. Setup Instructions**: Exact step-by-step terminal commands from clone to launch.
- [x] **4. Environment Variables**: Documented with `.env.example` and zero committed secrets.
- [x] **5. How to Use the Agent**: Clear categorized queries covering lookups, reasoning, mutations, and guardrails.
- [x] **Zero Tailwind**: 100% pure custom CSS matching the official AUST color palette.
- [x] **Persistent Database**: All actions sync to MongoDB Atlas with zero-crash fallback.

