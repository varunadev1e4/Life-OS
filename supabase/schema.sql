-- ============================================================
-- LIFE OS — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (app settings stored in local table)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_hash TEXT NOT NULL,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITEMS (Books, Movies, TV Shows, Courses, Articles, Podcasts, Custom)
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('book', 'movie', 'tv_show', 'course', 'article', 'podcast', 'custom')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'dropped', 'wishlist')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  cover_url TEXT,
  author_creator TEXT,
  year INTEGER,
  genre TEXT,
  notes TEXT,
  highlights TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Progress tracking (flexible)
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER,
  progress_unit TEXT DEFAULT 'pages' CHECK (progress_unit IN ('pages', 'minutes', 'hours', 'episodes', 'chapters', 'percent', 'lessons')),
  -- External IDs
  external_id TEXT,
  external_url TEXT,
  -- Timestamps
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for items
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_rating ON items(rating);
CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_completed_at ON items(completed_at DESC);

-- ============================================================
-- JOURNAL LOGS (Daily entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  title TEXT,
  notes TEXT,
  highlights TEXT,
  gratitude TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_tags ON journal_logs USING gin(tags);

-- ============================================================
-- HABITS
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✓',
  color TEXT DEFAULT '#7c6af7',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  frequency_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon ... 7=Sun
  target_count INTEGER DEFAULT 1, -- times per day/week
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_order ON habits(order_index);

-- ============================================================
-- HABIT LOGS (Daily completions)
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  count INTEGER DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date DESC);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'health', 'career', 'learning', 'finance', 'relationships', 'creative', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  deadline DATE,
  milestones JSONB DEFAULT '[]',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_goals_pinned ON goals(is_pinned);

-- ============================================================
-- TAGS (for knowledge graph / second brain)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#7c6af7',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER journal_updated_at BEFORE UPDATE ON journal_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (for single-user Supabase access)
-- Since this is a private single-user app, we use anon key with RLS disabled
-- or enable RLS with a simple policy
-- ============================================================

-- Option A: Disable RLS (simpler for single-user)
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role (for single-user app with anon key)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Habit streaks view
CREATE OR REPLACE VIEW habit_streak_view AS
SELECT
  h.id,
  h.name,
  h.icon,
  h.color,
  COUNT(hl.id) FILTER (WHERE hl.completed = true) AS total_completions,
  MAX(hl.date) FILTER (WHERE hl.completed = true) AS last_completed,
  -- Current streak calculation done in app layer for flexibility
  (
    SELECT COUNT(*)
    FROM habit_logs hl2
    WHERE hl2.habit_id = h.id
      AND hl2.completed = true
      AND hl2.date >= CURRENT_DATE - INTERVAL '30 days'
  ) AS completions_last_30_days
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id
WHERE h.is_active = true
GROUP BY h.id, h.name, h.icon, h.color;

GRANT SELECT ON habit_streak_view TO anon;

-- Monthly reading stats
CREATE OR REPLACE VIEW monthly_completion_stats AS
SELECT
  DATE_TRUNC('month', completed_at) AS month,
  type,
  COUNT(*) AS count
FROM items
WHERE status = 'completed' AND completed_at IS NOT NULL
GROUP BY DATE_TRUNC('month', completed_at), type
ORDER BY month DESC;

GRANT SELECT ON monthly_completion_stats TO anon;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE items IS 'Books, movies, TV shows, courses, articles, podcasts, custom items';
COMMENT ON TABLE journal_logs IS 'Daily journal entries with mood and energy tracking';
COMMENT ON TABLE habits IS 'Recurring habits to track daily';
COMMENT ON TABLE habit_logs IS 'Daily log of habit completions';
COMMENT ON TABLE goals IS 'Personal goals with progress tracking';
