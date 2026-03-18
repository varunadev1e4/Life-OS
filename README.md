# ◎ Life OS

> Your personal life management system — track books, movies, habits, goals, and journal entries. A private, single-user PWA built with React + Supabase.

![Life OS](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8?style=flat-square)

---

## ✨ Features

### 📚 Library System
- Track **Books, Movies, TV Shows, Courses, Articles, Podcasts, Custom items**
- Status tracking: Not Started → In Progress → Completed / Dropped / Wishlist
- 1–10 star ratings with color-coded visualization
- Progress tracking (pages, episodes, minutes, lessons, etc.)
- Notes, highlights, and tag-based organization
- Advanced search & filters (type, status, rating, tags)

### 📔 Journal
- Daily entries with **mood (1–10)** and **energy (1–10)** tracking
- Highlights & gratitude sections
- Calendar heatmap view of past entries
- Tag-based entries

### ✅ Habits Tracker
- Daily habit tracking with streak counting
- 7-day completion history grid
- 30-day completion rate analytics
- Custom icons and colors per habit
- Real-time optimistic UI updates

### 🎯 Goals System
- Measurable goals with progress tracking
- Milestone checklist per goal
- Category-based organization (Health, Career, Learning, etc.)
- Deadline tracking

### 📊 Analytics Dashboard
- Monthly completion charts (BarChart + AreaChart)
- Library breakdown by type (PieChart)
- Rating distribution histogram
- Mood & energy trends over time
- Habit completion rate visualization
- Goal progress comparison chart

### 🔐 Authentication
- Custom PIN-based access (4–6 digits)
- SHA-256 hashed PIN stored in Supabase
- 7-day session persistence
- No external auth service needed

### ⚡ PWA + Offline Support
- Installable on mobile & desktop
- Service worker with network-first caching
- Offline banner when disconnected
- Background sync when reconnected

---

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run `supabase/schema.sql` (full schema)
4. Optionally run `supabase/seed.sql` for sample data
5. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`

### 2. Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/life-os
cd life-os

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you'll be prompted to create a PIN on first launch.

### 3. Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel
# Follow prompts, set environment variables when asked
```

**Option B: GitHub Integration**
1. Push to GitHub
2. Connect repo in [vercel.com/new](https://vercel.com/new)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## 🗂️ Project Structure

```
life-os/
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   └── icons/           # Add icon-192.png & icon-512.png
├── src/
│   ├── components/
│   │   ├── ui/          # Button, Input, Modal, Toast, etc.
│   │   ├── layout/      # AppLayout, PinGate
│   │   ├── library/     # ItemCard, ItemFormModal
│   │   ├── journal/     # JournalEntryModal
│   │   ├── habits/      # HabitFormModal
│   │   └── goals/       # GoalFormModal, GoalDetailModal
│   ├── context/
│   │   ├── AuthContext.tsx     # PIN auth
│   │   └── ToastContext.tsx    # Notifications
│   ├── hooks/
│   │   └── index.ts            # useDebounce, useOffline, etc.
│   ├── lib/
│   │   ├── supabase.ts         # API layer
│   │   └── store.ts            # Zustand stores
│   ├── pages/                  # Route components
│   ├── types/                  # TypeScript types
│   └── utils/
│       ├── helpers.ts          # Utilities
│       └── constants.ts        # Config constants
├── supabase/
│   ├── schema.sql              # Full DB schema
│   └── seed.sql                # Sample data
├── vercel.json                 # Deployment config
└── vite.config.ts              # Build config + PWA
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + Custom CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Backend | Supabase (PostgreSQL + REST) |
| Build | Vite 5 |
| PWA | vite-plugin-pwa + Workbox |
| Deployment | Vercel |
| Icons | Lucide React |

---

## 📱 PWA Installation

### iOS
1. Open in Safari
2. Tap Share → "Add to Home Screen"

### Android
1. Open in Chrome
2. Tap menu → "Add to Home Screen" or "Install App"

### Desktop
1. Click the install icon in the address bar (Chrome/Edge)

---

## 🔒 Security Notes

- PIN is hashed with **SHA-256** via Web Crypto API before storing
- No plaintext PIN is ever stored in the database
- Single-user app — RLS is disabled for simplicity; add it back for hosted instances
- Session expires after 7 days of inactivity

---

## 🎨 Adding PWA Icons

The app needs two icon files in `public/icons/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

You can generate these from any square logo using tools like [realfavicongenerator.net](https://realfavicongenerator.net).

---

## 📦 Key Dependencies

```json
{
  "@supabase/supabase-js": "^2.39.0",    // Database
  "framer-motion": "^11.0.6",            // Animations
  "recharts": "^2.12.0",                 // Charts
  "zustand": "^4.5.0",                   // State management
  "react-router-dom": "^6.22.0",         // Routing
  "date-fns": "^3.2.0",                  // Date utilities
  "lucide-react": "^0.323.0",            // Icons
  "vite-plugin-pwa": "^0.19.0"           // PWA support
}
```

---

## 📄 License

MIT — use it however you like. It's your Life OS. Own it.
