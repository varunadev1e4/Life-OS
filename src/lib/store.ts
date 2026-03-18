import { create } from 'zustand'
import { itemsApi, journalApi, habitsApi, goalsApi } from '@/lib/supabase'
import { calculateStreak, today, getLast30Days } from '@/utils/helpers'
import type {
  Item, ItemInsert, ItemUpdate,
  JournalLog, JournalInsert, JournalUpdate,
  Habit, HabitInsert, HabitUpdate, HabitWithStreak, HabitLog,
  Goal, GoalInsert, GoalUpdate,
  FilterState,
} from '@/types'

// ─── Items Store ────────────────────────────────────────────
interface ItemsStore {
  items: Item[]
  isLoading: boolean
  error: string | null
  filters: FilterState
  fetchItems: () => Promise<void>
  addItem: (item: ItemInsert) => Promise<Item>
  updateItem: (id: string, updates: ItemUpdate) => Promise<Item>
  deleteItem: (id: string) => Promise<void>
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  getFilteredItems: () => Item[]
}

const defaultFilters: FilterState = {
  type: 'all',
  status: 'all',
  rating: null,
  tags: [],
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
}

export const useItemsStore = create<ItemsStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  filters: defaultFilters,

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await itemsApi.getAll()
      set({ items, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  addItem: async (item: ItemInsert) => {
    const created = await itemsApi.create(item)
    set(s => ({ items: [created, ...s.items] }))
    return created
  },

  updateItem: async (id: string, updates: ItemUpdate) => {
    const updated = await itemsApi.update(id, updates)
    set(s => ({ items: s.items.map(i => i.id === id ? updated : i) }))
    return updated
  },

  deleteItem: async (id: string) => {
    await itemsApi.delete(id)
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
  },

  setFilters: (filters: Partial<FilterState>) => {
    set(s => ({ filters: { ...s.filters, ...filters } }))
  },

  resetFilters: () => set({ filters: defaultFilters }),

  getFilteredItems: () => {
    const { items, filters } = get()
    let filtered = [...items]

    if (filters.type !== 'all') {
      filtered = filtered.filter(i => i.type === filters.type)
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(i => i.status === filters.status)
    }
    if (filters.rating !== null) {
      filtered = filtered.filter(i => i.rating != null && i.rating >= (filters.rating ?? 0))
    }
    if (filters.tags.length > 0) {
      filtered = filtered.filter(i => filters.tags.some(t => i.tags.includes(t)))
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.author_creator?.toLowerCase().includes(q) ||
        i.genre?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      const key = filters.sortBy
      const aVal = a[key] ?? ''
      const bVal = b[key] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal))
      return filters.sortOrder === 'asc' ? cmp : -cmp
    })

    return filtered
  },
}))

// ─── Journal Store ──────────────────────────────────────────
interface JournalStore {
  logs: JournalLog[]
  isLoading: boolean
  error: string | null
  fetchLogs: (limit?: number) => Promise<void>
  getTodayLog: () => JournalLog | undefined
  upsertLog: (entry: JournalInsert) => Promise<JournalLog>
  updateLog: (id: string, updates: JournalUpdate) => Promise<JournalLog>
  deleteLog: (id: string) => Promise<void>
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async (limit = 50) => {
    set({ isLoading: true, error: null })
    try {
      const logs = await journalApi.getAll(limit)
      set({ logs, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  getTodayLog: () => {
    const todayStr = today()
    return get().logs.find(l => l.date === todayStr)
  },

  upsertLog: async (entry: JournalInsert) => {
    const log = await journalApi.upsert(entry)
    set(s => {
      const exists = s.logs.find(l => l.id === log.id)
      const logs = exists
        ? s.logs.map(l => l.id === log.id ? log : l)
        : [log, ...s.logs].sort((a, b) => b.date.localeCompare(a.date))
      return { logs }
    })
    return log
  },

  updateLog: async (id: string, updates: JournalUpdate) => {
    const updated = await journalApi.update(id, updates)
    set(s => ({ logs: s.logs.map(l => l.id === id ? updated : l) }))
    return updated
  },

  deleteLog: async (id: string) => {
    await journalApi.delete(id)
    set(s => ({ logs: s.logs.filter(l => l.id !== id) }))
  },
}))

// ─── Habits Store ───────────────────────────────────────────
interface HabitsStore {
  habits: Habit[]
  logs: HabitLog[]
  isLoading: boolean
  error: string | null
  fetchHabits: () => Promise<void>
  fetchLogs: (days?: number) => Promise<void>
  addHabit: (habit: HabitInsert) => Promise<Habit>
  updateHabit: (id: string, updates: HabitUpdate) => Promise<Habit>
  deleteHabit: (id: string) => Promise<void>
  toggleHabit: (habitId: string, date: string, completed: boolean) => Promise<void>
  getHabitsWithStats: () => HabitWithStreak[]
  getTodayCompletionRate: () => number
}

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  logs: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null })
    try {
      const habits = await habitsApi.getAll()
      set({ habits, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  fetchLogs: async (days = 30) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    try {
      const logs = await habitsApi.getLogsForDateRange(startStr, endStr)
      set({ logs })
    } catch (err) {
      console.error('Failed to fetch habit logs:', err)
    }
  },

  addHabit: async (habit: HabitInsert) => {
    const created = await habitsApi.create(habit)
    set(s => ({ habits: [...s.habits, created] }))
    return created
  },

  updateHabit: async (id: string, updates: HabitUpdate) => {
    const updated = await habitsApi.update(id, updates)
    set(s => ({ habits: s.habits.map(h => h.id === id ? updated : h) }))
    return updated
  },

  deleteHabit: async (id: string) => {
    await habitsApi.delete(id)
    set(s => ({ habits: s.habits.filter(h => h.id !== id) }))
  },

  toggleHabit: async (habitId: string, date: string, completed: boolean) => {
    const log = await habitsApi.toggleLog(habitId, date, completed)
    set(s => {
      const existing = s.logs.find(l => l.habit_id === habitId && l.date === date)
      const logs = existing
        ? s.logs.map(l => (l.habit_id === habitId && l.date === date) ? log : l)
        : [...s.logs, log]
      return { logs }
    })
  },

  getHabitsWithStats: () => {
    const { habits, logs } = get()
    const todayStr = today()
    const { start } = getLast30Days()

    return habits.map(habit => {
      const habitLogs = logs.filter(l => l.habit_id === habit.id)
      const completedLogs = habitLogs.filter(l => l.completed)
      const completedDates = completedLogs.map(l => l.date)
      const streak = calculateStreak(completedDates)
      const todayLog = habitLogs.find(l => l.date === todayStr) || null
      const completedInRange = completedLogs.filter(l => l.date >= start).length
      const completionRate = Math.round((completedInRange / 30) * 100)

      return {
        ...habit,
        streak,
        completedToday: todayLog?.completed ?? false,
        completionRate,
        totalCompletions: completedLogs.length,
        todayLog,
      } as HabitWithStreak
    })
  },

  getTodayCompletionRate: () => {
    const { habits, logs } = get()
    if (habits.length === 0) return 0
    const todayStr = today()
    const completed = logs.filter(l => l.date === todayStr && l.completed).length
    return Math.round((completed / habits.length) * 100)
  },
}))

// ─── Goals Store ────────────────────────────────────────────
interface GoalsStore {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  fetchGoals: () => Promise<void>
  addGoal: (goal: GoalInsert) => Promise<Goal>
  updateGoal: (id: string, updates: GoalUpdate) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  getActiveGoals: () => Goal[]
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null })
    try {
      const goals = await goalsApi.getAll()
      set({ goals, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  addGoal: async (goal: GoalInsert) => {
    const created = await goalsApi.create(goal)
    set(s => ({ goals: [created, ...s.goals] }))
    return created
  },

  updateGoal: async (id: string, updates: GoalUpdate) => {
    const updated = await goalsApi.update(id, updates)
    set(s => ({ goals: s.goals.map(g => g.id === id ? updated : g) }))
    return updated
  },

  deleteGoal: async (id: string) => {
    await goalsApi.delete(id)
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }))
  },

  getActiveGoals: () => get().goals.filter(g => g.status === 'active'),
}))