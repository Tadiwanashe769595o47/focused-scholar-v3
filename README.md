# Focused Scholar V3

Premium IGCSE AI Academic Assistant and Board Revision Platform

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: TailwindCSS 4 + Lucide Icons + Framer Motion
- **Backend**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Desktop**: Electron 41

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (already configured)

### Installation

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Or build desktop app
npm run electron:build
```

### Default Credentials

**Teacher Login:**
- Username: `teacher`
- Password: `teacher123`
- Access Code: `123456`

**Holiday Access:**
- Code: `789012`

**Parent Access:**
- Code: `parent123`

## Project Structure

```
focused-scholar-v3/
├── src/                    # React frontend
│   ├── pages/             # All page components
│   ├── stores/            # Zustand state stores
│   ├── lib/               # Supabase client
│   └── App.tsx            # Main app component
├── server/                 # Express backend
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Auth middleware
│   ├── supabase.ts        # Supabase client
│   └── index.ts           # Server entry point
├── electron/               # Electron desktop
│   ├── main.ts            # Main process
│   └── preload.ts         # Preload script
└── supabase-schema.sql    # Database schema
```

## Features

- 10 IGCSE subjects with daily tests
- Spaced repetition system
- Progress tracking & analytics
- Teacher dashboard
- Homework & holiday work
- Flashcards
- AI Tutor (requires API key)
- Gamification (badges, streaks, points)

## Supabase Setup

The database schema is in `server/supabase-schema.sql`. Run this in your Supabase SQL Editor:
https://app.supabase.com/project/bpvwkmkwecjqwjyvtzuh/sql

## Environment Variables

See `.env` file for configuration. Key variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `TEACHER_ACCESS_CODE` - Teacher access code
- `JWT_SECRET` - JWT signing secret

## Build Commands

```bash
npm run dev           # Start dev server
npm run build         # Build frontend
npm run electron:dev  # Run Electron in dev mode
npm run electron:build # Build Windows installer
```

## License

Focused Scholar V3 - All rights reserved
