-- ============================================================
-- LIFE OS — Seed Data
-- Run after schema.sql
-- ============================================================

-- Insert initial app settings (PIN: 1234, stored as sha256 hash)
-- In production, the app will hash the PIN before storing
INSERT INTO app_settings (pin_hash, theme)
VALUES ('03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'dark')
ON CONFLICT DO NOTHING;

-- Sample Books
INSERT INTO items (title, type, status, rating, author_creator, year, genre, notes, tags, progress_current, progress_total, progress_unit, completed_at) VALUES
('Atomic Habits', 'book', 'completed', 9, 'James Clear', 2018, 'Self-Help', 'Transformative book on building systems rather than goals. The 1% better every day compound effect is real.', ARRAY['productivity', 'habits', 'psychology'], 320, 320, 'pages', '2024-01-15'),
('The Pragmatic Programmer', 'book', 'completed', 10, 'David Thomas & Andrew Hunt', 2019, 'Technology', 'Essential read for any developer. Covers everything from code quality to career advice.', ARRAY['programming', 'career', 'software'], 352, 352, 'pages', '2024-02-20'),
('Deep Work', 'book', 'in_progress', NULL, 'Cal Newport', 2016, 'Productivity', 'Currently on chapter 4. The idea of deliberate focus is compelling.', ARRAY['productivity', 'focus', 'career'], 145, 296, 'pages', NULL),
('Thinking, Fast and Slow', 'book', 'wishlist', NULL, 'Daniel Kahneman', 2011, 'Psychology', 'Recommended by multiple people. About cognitive biases and decision making.', ARRAY['psychology', 'decision-making'], 0, 499, 'pages', NULL);

-- Sample Movies
INSERT INTO items (title, type, status, rating, author_creator, year, genre, notes, tags, completed_at) VALUES
('Interstellar', 'movie', 'completed', 10, 'Christopher Nolan', 2014, 'Sci-Fi', 'Breathtaking. The docking scene with Hans Zimmer score gives me chills every time.', ARRAY['sci-fi', 'space', 'mind-bending'], '2024-01-08'),
('Everything Everywhere All at Once', 'movie', 'completed', 9, 'The Daniels', 2022, 'Sci-Fi/Comedy', 'Chaotic but profound. The hot dog fingers universe broke me.', ARRAY['sci-fi', 'comedy', 'multiverse'], '2024-03-01'),
('Oppenheimer', 'movie', 'completed', 8, 'Christopher Nolan', 2023, 'Historical Drama', 'Dense and intense. Cillian Murphy was incredible.', ARRAY['history', 'drama', 'war'], '2024-01-22');

-- Sample TV Shows
INSERT INTO items (title, type, status, rating, author_creator, year, genre, notes, tags, progress_current, progress_total, progress_unit) VALUES
('Severance', 'tv_show', 'completed', 10, 'Dan Erickson', 2022, 'Thriller/Sci-Fi', 'Perfect television. Every episode ends on a cliffhanger. Season 2 was even better.', ARRAY['thriller', 'sci-fi', 'corporate'], 9, 9, 'episodes'),
('The Bear', 'tv_show', 'in_progress', NULL, 'Christopher Storer', 2022, 'Drama', 'Stressful but brilliant. Currently on Season 2.', ARRAY['drama', 'food', 'family'], 3, 10, 'episodes');

-- Sample Courses
INSERT INTO items (title, type, status, rating, author_creator, year, genre, notes, tags, progress_current, progress_total, progress_unit) VALUES
('CS50: Introduction to Computer Science', 'course', 'completed', 9, 'David Malan (Harvard)', 2023, 'Computer Science', 'Best introductory CS course. Week 5 (Data Structures) was the toughest but most rewarding.', ARRAY['programming', 'cs', 'algorithms'], 9, 9, 'lessons'),
('Machine Learning Specialization', 'course', 'in_progress', NULL, 'Andrew Ng (Coursera)', 2022, 'AI/ML', 'Working through gradient descent. The math is clicking slowly.', ARRAY['ai', 'ml', 'math'], 4, 12, 'lessons');

-- Sample Journal Entries
INSERT INTO journal_logs (date, mood, energy, title, notes, highlights, gratitude, tags) VALUES
(CURRENT_DATE, 8, 7, 'Productive morning', 'Had a great deep work session this morning. Finished the main feature I''ve been working on. Feeling accomplished.', 'Shipped a key feature; Had a great conversation with an old friend', 'Grateful for good health, meaningful work, and morning coffee ☕', ARRAY['productive', 'coding']),
(CURRENT_DATE - 1, 6, 5, 'Slow day', 'Couldn''t get into flow state. Distracted by notifications. Need to be more intentional tomorrow.', 'Went for a 30-minute walk which helped clear my head', 'Grateful for the walk; evening was peaceful', ARRAY['reflection']),
(CURRENT_DATE - 2, 9, 9, 'Flow state unlocked', 'One of the best days in a while. Everything clicked. Finished 3 chapters of Deep Work and applied the concepts immediately.', 'Longest uninterrupted work session in months; Cooked a great dinner', 'Grateful for focus, good food, and clear weather', ARRAY['flow', 'reading', 'cooking']),
(CURRENT_DATE - 3, 7, 8, 'Learning day', 'Continued the ML course. Gradient descent finally makes sense visually. Drew diagrams to understand it better.', 'Breakthrough moment with ML concepts; Great lunch', 'Grateful for the patience to learn hard things', ARRAY['learning', 'ai']),
(CURRENT_DATE - 7, 5, 4, 'Under the weather', 'Not feeling my best. Rested most of the day. Watched Severance finale.', 'Caught up on shows; Body needed the rest', 'Grateful for the ability to rest when needed', ARRAY['rest', 'health']);

-- Sample Habits
INSERT INTO habits (name, description, icon, color, frequency, target_count, is_active, order_index) VALUES
('Morning Pages', 'Write 3 pages of stream-of-consciousness every morning', '📝', '#7c6af7', 'daily', 1, true, 1),
('Exercise', 'At least 30 minutes of movement — gym, run, or yoga', '💪', '#34d399', 'daily', 1, true, 2),
('Read', 'Read at least 20 pages of a book', '📖', '#f59e0b', 'daily', 1, true, 3),
('Meditate', '10 minutes of mindfulness meditation', '🧘', '#38bdf8', 'daily', 1, true, 4),
('No Social Media', 'Avoid mindless social media scrolling', '📵', '#f87171', 'daily', 1, true, 5),
('Gratitude', 'Write 3 things you''re grateful for', '🙏', '#f59e0b', 'daily', 1, true, 6),
('Weekly Review', 'Review goals, habits, and journal from the past week', '🔍', '#7c6af7', 'weekly', 1, true, 7);

-- Sample Habit Logs (last 14 days)
DO $$
DECLARE
  habit_morning_pages UUID;
  habit_exercise UUID;
  habit_read UUID;
  habit_meditate UUID;
  habit_no_social UUID;
  habit_gratitude UUID;
  d INTEGER;
BEGIN
  SELECT id INTO habit_morning_pages FROM habits WHERE name = 'Morning Pages';
  SELECT id INTO habit_exercise FROM habits WHERE name = 'Exercise';
  SELECT id INTO habit_read FROM habits WHERE name = 'Read';
  SELECT id INTO habit_meditate FROM habits WHERE name = 'Meditate';
  SELECT id INTO habit_no_social FROM habits WHERE name = 'No Social Media';
  SELECT id INTO habit_gratitude FROM habits WHERE name = 'Gratitude';

  FOR d IN 0..13 LOOP
    -- Morning Pages: 80% completion rate
    IF random() > 0.2 THEN
      INSERT INTO habit_logs (habit_id, date, completed) VALUES (habit_morning_pages, CURRENT_DATE - d, true) ON CONFLICT DO NOTHING;
    END IF;
    -- Exercise: 70% completion rate
    IF random() > 0.3 THEN
      INSERT INTO habit_logs (habit_id, date, completed) VALUES (habit_exercise, CURRENT_DATE - d, true) ON CONFLICT DO NOTHING;
    END IF;
    -- Read: 90% completion rate
    IF random() > 0.1 THEN
      INSERT INTO habit_logs (habit_id, date, completed) VALUES (habit_read, CURRENT_DATE - d, true) ON CONFLICT DO NOTHING;
    END IF;
    -- Meditate: 60% completion rate
    IF random() > 0.4 THEN
      INSERT INTO habit_logs (habit_id, date, completed) VALUES (habit_meditate, CURRENT_DATE - d, true) ON CONFLICT DO NOTHING;
    END IF;
    -- No Social Media: 50% completion rate (hardest)
    IF random() > 0.5 THEN
      INSERT INTO habit_logs (habit_id, date, completed) VALUES (habit_no_social, CURRENT_DATE - d, true) ON CONFLICT DO NOTHING;
    END IF;
    -- Gratitude: 85% completion rate
    IF random() > 0.15 THEN
      INSERT INTO habit_logs (habit_id, date, completed) VALUES (habit_gratitude, CURRENT_DATE - d, true) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Sample Goals
INSERT INTO goals (title, description, category, status, target_value, current_value, unit, deadline, milestones, notes, tags, is_pinned) VALUES
('Read 24 Books This Year', 'Averaging 2 books per month. Mix of technical, self-help, and fiction.', 'learning', 'active', 24, 4, 'books', '2024-12-31',
  '[{"id":"1","title":"Read 6 books (Q1)","completed":false},{"id":"2","title":"Read 12 books (H1)","completed":false},{"id":"3","title":"Read 18 books (Q3)","completed":false}]',
  'Currently tracking in Library. Focus on finishing Deep Work next.', ARRAY['reading', 'learning'], true),

('Build a Side Project', 'Launch a working product that solves a real problem', 'career', 'active', 100, 35, 'percent', '2024-06-30',
  '[{"id":"1","title":"Define the problem","completed":true},{"id":"2","title":"Build MVP","completed":false},{"id":"3","title":"Get first user","completed":false},{"id":"4","title":"Launch publicly","completed":false}]',
  'Working on Life OS as the project. Making steady progress.', ARRAY['coding', 'startup', 'career'], true),

('Run a Half Marathon', 'Train consistently and complete a 21.1km race', 'health', 'active', 21.1, 8.5, 'km (longest run)', '2024-09-30',
  '[{"id":"1","title":"Run 5K comfortably","completed":true},{"id":"2","title":"Run 10K","completed":false},{"id":"3","title":"Run 15K","completed":false},{"id":"4","title":"Race day!","completed":false}]',
  'Following a 16-week training plan. Currently in week 4.', ARRAY['running', 'health', 'fitness'], false),

('Save Emergency Fund', 'Build 6 months of expenses as safety net', 'finance', 'active', 6, 2.5, 'months of expenses', '2024-12-31',
  '[{"id":"1","title":"1 month saved","completed":true},{"id":"2","title":"3 months saved","completed":false},{"id":"3","title":"6 months saved","completed":false}]',
  'Automating monthly transfers. Slow but steady.', ARRAY['finance', 'savings'], false);

-- Sample Tags
INSERT INTO tags (name, color, description) VALUES
('productivity', '#7c6af7', 'Productivity systems, tools, and techniques'),
('habits', '#34d399', 'Habit formation and behavior change'),
('psychology', '#f59e0b', 'Human psychology and cognitive science'),
('programming', '#38bdf8', 'Software development and coding'),
('career', '#f87171', 'Career development and professional growth'),
('health', '#34d399', 'Physical and mental health'),
('learning', '#7c6af7', 'Skills acquisition and education'),
('finance', '#f59e0b', 'Personal finance and investing'),
('sci-fi', '#38bdf8', 'Science fiction media'),
('focus', '#f0f0f5', 'Focus, deep work, and flow state')
ON CONFLICT (name) DO NOTHING;
