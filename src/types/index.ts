// ============================================================
// LIFE OS — Core Types
// ============================================================

export type ItemType = 'book' | 'movie' | 'tv_show' | 'course' | 'article' | 'podcast' | 'custom'
export type ItemStatus = 'not_started' | 'in_progress' | 'completed' | 'dropped' | 'wishlist'
export type ProgressUnit = 'pages' | 'minutes' | 'hours' | 'episodes' | 'chapters' | 'percent' | 'lessons'
export type HabitFrequency = 'daily' | 'weekly' | 'custom'
export type GoalCategory = 'personal' | 'health' | 'career' | 'learning' | 'finance' | 'relationships' | 'creative' | 'other'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface Item {
  id: string
  title: string
  type: ItemType
  status: ItemStatus
  rating?: number | null
  cover_url?: string | null
  author_creator?: string | null
  year?: number | null
  genre?: string | null
  notes?: string | null
  highlights?: string | null
  tags: string[]
  progress_current: number
  progress_total?: number | null
  progress_unit: ProgressUnit
  external_id?: string | null
  external_url?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export type ItemInsert = Omit<Item, 'id' | 'created_at' | 'updated_at'>
export type ItemUpdate = Partial<ItemInsert>

export interface JournalLog {
  id: string
  date: string
  mood?: number | null
  energy?: number | null
  title?: string | null
  notes?: string | null
  highlights?: string | null
  gratitude?: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type JournalInsert = Omit<JournalLog, 'id' | 'created_at' | 'updated_at'>
export type JournalUpdate = Partial<JournalInsert>

export interface Habit {
  id: string
  name: string
  description?: string | null
  icon: string
  color: string
  frequency: HabitFrequency
  frequency_days: number[]
  target_count: number
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type HabitInsert = Omit<Habit, 'id' | 'created_at' | 'updated_at'>
export type HabitUpdate = Partial<HabitInsert>

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  completed: boolean
  count: number
  note?: string | null
  created_at: string
}

export interface HabitWithStreak extends Habit {
  streak: number
  completedToday: boolean
  completionRate: number // last 30 days
  totalCompletions: number
  todayLog?: HabitLog | null
}

export interface GoalMilestone {
  id: string
  title: string
  completed: boolean
}

export interface Goal {
  id: string
  title: string
  description?: string | null
  category: GoalCategory
  status: GoalStatus
  target_value?: number | null
  current_value: number
  unit?: string | null
  deadline?: string | null
  milestones: GoalMilestone[]
  notes?: string | null
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at'>
export type GoalUpdate = Partial<GoalInsert>

export interface Tag {
  id: string
  name: string
  color: string
  description?: string | null
  created_at: string
}

export interface AppSettings {
  id: string
  pin_hash: string
  theme: 'dark' | 'light'
  created_at: string
  updated_at: string
}

// Analytics types
export interface MonthlyStats {
  month: string
  books: number
  movies: number
  tv_shows: number
  courses: number
  articles: number
  podcasts: number
  total: number
}

export interface DailyMoodEntry {
  date: string
  mood: number
  energy: number
}

export interface HabitCompletionRate {
  habitId: string
  habitName: string
  rate: number
  color: string
}

export interface DashboardStats {
  totalItems: number
  completedItems: number
  inProgressItems: number
  currentStreak: number
  activeGoals: number
  journalDaysThisMonth: number
  habitCompletionToday: number
  booksThisYear: number
  moviesThisYear: number
}

// UI types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export interface FilterState {
  type: ItemType | 'all'
  status: ItemStatus | 'all'
  rating: number | null
  tags: string[]
  search: string
  sortBy: 'created_at' | 'updated_at' | 'title' | 'rating' | 'completed_at'
  sortOrder: 'asc' | 'desc'
}

export interface Note {
  id: string
  title: string | null
  content: string
  color: string
  is_pinned: boolean
  is_archived: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at'>
export type NoteUpdate = Partial<NoteInsert>

// ── Expense Tracker ──────────────────────────────────────────
export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'health' | 'entertainment' | 'bills' | 'education' | 'travel' | 'personal' | 'other'
export type PaymentMethod   = 'cash' | 'card' | 'upi' | 'netbanking' | 'other'

export interface Expense {
  id: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  notes: string | null
  is_recurring: boolean
  payment_method: PaymentMethod
  created_at: string
  updated_at: string
}
export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>
export type ExpenseUpdate  = Partial<ExpenseInsert>

// ── Occasion Tracker ─────────────────────────────────────────
export type OccasionType = 'birthday' | 'anniversary' | 'graduation' | 'wedding' | 'festival' | 'meeting' | 'other'

export interface Occasion {
  id: string
  person_name: string
  occasion_type: OccasionType
  date: string
  is_recurring: boolean
  notes: string | null
  gift_ideas: string | null
  budget: number | null
  is_completed: boolean
  created_at: string
  updated_at: string
}
export type OccasionInsert = Omit<Occasion, 'id' | 'created_at' | 'updated_at'>
export type OccasionUpdate  = Partial<OccasionInsert>