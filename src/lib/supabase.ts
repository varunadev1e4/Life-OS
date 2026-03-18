import { createClient } from '@supabase/supabase-js'
import type {
  Item, ItemInsert, ItemUpdate,
  JournalLog, JournalInsert, JournalUpdate,
  Habit, HabitInsert, HabitUpdate,
  HabitLog,
  Goal, GoalInsert, GoalUpdate,
  Tag, AppSettings,
  Note, NoteInsert, NoteUpdate,
  Expense, ExpenseInsert, ExpenseUpdate,
  Occasion, OccasionInsert, OccasionUpdate,
  DailyHealth, HealthInsert, HealthUpdate,
  Bookmark, BookmarkInsert, BookmarkUpdate,
  Task, TaskInsert, TaskUpdate,
  WeeklyReview, WeeklyReviewInsert, WeeklyReviewUpdate
} from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }, // No Supabase auth; using custom PIN
  realtime: { params: { eventsPerSecond: 10 } },
})

// ============================================================
// ITEMS API
// ============================================================
export const itemsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Item[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Item
  },

  async create(item: ItemInsert) {
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single()
    if (error) throw error
    return data as Item
  },

  async update(id: string, updates: ItemUpdate) {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Item
  },

  async delete(id: string) {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
  },

  async getByType(type: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Item[]
  },

  async getCompletedThisYear() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'completed')
      .gte('completed_at', startOfYear)
    if (error) throw error
    return data as Item[]
  },
}

// ============================================================
// JOURNAL API
// ============================================================
export const journalApi = {
  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('journal_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as JournalLog[]
  },

  async getByDate(date: string) {
    const { data, error } = await supabase
      .from('journal_logs')
      .select('*')
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data as JournalLog | null
  },

  async upsert(entry: JournalInsert) {
    const { data, error } = await supabase
      .from('journal_logs')
      .upsert(entry, { onConflict: 'date' })
      .select()
      .single()
    if (error) throw error
    return data as JournalLog
  },

  async update(id: string, updates: JournalUpdate) {
    const { data, error } = await supabase
      .from('journal_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as JournalLog
  },

  async delete(id: string) {
    const { error } = await supabase.from('journal_logs').delete().eq('id', id)
    if (error) throw error
  },

  async getLastNDays(days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const { data, error } = await supabase
      .from('journal_logs')
      .select('date, mood, energy')
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: true })
    if (error) throw error
    return data
  },
}

// ============================================================
// HABITS API
// ============================================================
export const habitsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (error) throw error
    return data as Habit[]
  },

  async create(habit: HabitInsert) {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single()
    if (error) throw error
    return data as Habit
  },

  async update(id: string, updates: HabitUpdate) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Habit
  },

  async delete(id: string) {
    const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', id)
    if (error) throw error
  },

  async getLogsForDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return data as HabitLog[]
  },

  async getLogsForDate(date: string) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('date', date)
    if (error) throw error
    return data as HabitLog[]
  },

  async toggleLog(habitId: string, date: string, completed: boolean) {
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, date, completed }, { onConflict: 'habit_id,date' })
      .select()
      .single()
    if (error) throw error
    return data as HabitLog
  },
}

// ============================================================
// GOALS API
// ============================================================
export const goalsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(g => ({ ...g, milestones: g.milestones || [] })) as Goal[]
  },

  async create(goal: GoalInsert) {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single()
    if (error) throw error
    return data as Goal
  },

  async update(id: string, updates: GoalUpdate) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Goal
  },

  async delete(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw error
  },
}

// ============================================================
// TAGS API
// ============================================================
export const tagsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return data as Tag[]
  },

  async create(tag: Partial<Tag>) {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()
    if (error) throw error
    return data as Tag
  },
}


// ============================================================
// NOTES API
// ============================================================
export const notesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as Note[]
  },

  async create(note: NoteInsert) {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Note
  },

  async update(id: string, updates: NoteUpdate) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Note
  },

  async delete(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getArchived() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_archived', true)
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as Note[]
  },
}




// ============================================================
// TASKS API
// ============================================================
export const tasksApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tasks').select('*')
      .order('status', { ascending: true })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as Task[]
  },
  async create(t: TaskInsert) {
    const { data, error } = await supabase.from('tasks').insert(t).select().single()
    if (error) throw new Error(error.message)
    return data as Task
  },
  async update(id: string, u: TaskUpdate) {
    const { data, error } = await supabase.from('tasks').update(u).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Task
  },
  async delete(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ============================================================
// WEEKLY REVIEWS API
// ============================================================
export const weeklyReviewsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('weekly_reviews').select('*')
      .order('week_start', { ascending: false })
    if (error) throw new Error(error.message)
    return data as WeeklyReview[]
  },
  async getByWeek(weekStart: string) {
    const { data, error } = await supabase
      .from('weekly_reviews').select('*')
      .eq('week_start', weekStart).maybeSingle()
    if (error) throw new Error(error.message)
    return data as WeeklyReview | null
  },
  async upsert(r: WeeklyReviewInsert) {
    const { data, error } = await supabase
      .from('weekly_reviews').upsert(r, { onConflict: 'week_start' }).select().single()
    if (error) throw new Error(error.message)
    return data as WeeklyReview
  },
}

// ============================================================
// HEALTH API
// ============================================================
export const healthApi = {
  async getRecent(days = 30) {
    const since = new Date(); since.setDate(since.getDate() - days)
    const { data, error } = await supabase.from('daily_health').select('*')
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return data as DailyHealth[]
  },
  async upsert(entry: HealthInsert) {
    const { data, error } = await supabase.from('daily_health')
      .upsert(entry, { onConflict: 'date' }).select().single()
    if (error) throw new Error(error.message)
    return data as DailyHealth
  },
}

// ============================================================
// BOOKMARKS API
// ============================================================
export const bookmarksApi = {
  async getAll() {
    const { data, error } = await supabase.from('bookmarks').select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as Bookmark[]
  },
  async create(b: BookmarkInsert) {
    const { data, error } = await supabase.from('bookmarks').insert(b).select().single()
    if (error) throw new Error(error.message)
    return data as Bookmark
  },
  async update(id: string, updates: BookmarkUpdate) {
    const { data, error } = await supabase.from('bookmarks').update(updates).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Bookmark
  },
  async delete(id: string) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ============================================================
// EXPENSES API
// ============================================================
export const expensesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('expenses').select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as Expense[]
  },
  async create(e: ExpenseInsert) {
    const { data, error } = await supabase.from('expenses').insert(e).select().single()
    if (error) throw new Error(error.message)
    return data as Expense
  },
  async update(id: string, updates: ExpenseUpdate) {
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Expense
  },
  async delete(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ============================================================
// OCCASIONS API
// ============================================================
export const occasionsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('occasions').select('*')
      .order('date', { ascending: true })
    if (error) throw new Error(error.message)
    return data as Occasion[]
  },
  async create(o: OccasionInsert) {
    const { data, error } = await supabase.from('occasions').insert(o).select().single()
    if (error) throw new Error(error.message)
    return data as Occasion
  },
  async update(id: string, updates: OccasionUpdate) {
    const { data, error } = await supabase.from('occasions').update(updates).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Occasion
  },
  async delete(id: string) {
    const { error } = await supabase.from('occasions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ============================================================
// SETTINGS API
// ============================================================
export const settingsApi = {
  async get(): Promise<AppSettings | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[settingsApi.get]', error)
      throw new Error(error.message)
    }
    return data as AppSettings | null
  },

  async create(pinHash: string): Promise<AppSettings> {
    // Try insert first; if a row already exists, update it instead
    const { data: inserted, error: insertError } = await supabase
      .from('app_settings')
      .insert({ pin_hash: pinHash, theme: 'dark' })
      .select()
      .single()

    if (!insertError) return inserted as AppSettings

    // Row already exists — update the existing one
    const isDuplicate =
      insertError.code === '23505' ||
      insertError.message?.includes('duplicate') ||
      insertError.message?.includes('unique') ||
      insertError.message?.includes('violates')

    if (isDuplicate) {
      const { data: updated, error: updateError } = await supabase
        .from('app_settings')
        .update({ pin_hash: pinHash })
        .select()
        .single()
      if (updateError) {
        console.error('[settingsApi.create -> update]', updateError)
        throw new Error(updateError.message)
      }
      return updated as AppSettings
    }

    console.error('[settingsApi.create]', insertError)
    throw new Error(insertError.message)
  },

  async updatePin(id: string, pinHash: string): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ pin_hash: pinHash })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('[settingsApi.updatePin]', error)
      throw new Error(error.message)
    }
    return data as AppSettings
  },
}