import { format, formatDistanceToNow, parseISO, isToday, isYesterday, startOfMonth, endOfMonth } from 'date-fns'
import type { ItemType, ItemStatus, GoalCategory } from '@/types'

// ============================================================
// Date utilities
// ============================================================
export const formatDate = (date: string | Date, fmt = 'MMM d, yyyy') => {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, fmt)
}

export const formatDateShort = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d')
}

export const formatRelative = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export const today = () => new Date().toISOString().split('T')[0]

export const getMonthRange = (date = new Date()) => ({
  start: format(startOfMonth(date), 'yyyy-MM-dd'),
  end: format(endOfMonth(date), 'yyyy-MM-dd'),
})

export const getLast30Days = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

export const getLast7Days = (): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return format(d, 'yyyy-MM-dd')
  })
}

// ============================================================
// PIN hashing (SHA-256 via Web Crypto API)
// ============================================================
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

// ============================================================
// Item type config
// ============================================================
export const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; icon: string; color: string; progressUnit: string }> = {
  book: { label: 'Book', icon: '📚', color: '#f59e0b', progressUnit: 'pages' },
  movie: { label: 'Movie', icon: '🎬', color: '#f87171', progressUnit: 'minutes' },
  tv_show: { label: 'TV Show', icon: '📺', color: '#38bdf8', progressUnit: 'episodes' },
  course: { label: 'Course', icon: '🎓', color: '#7c6af7', progressUnit: 'lessons' },
  article: { label: 'Article', icon: '📄', color: '#34d399', progressUnit: 'minutes' },
  podcast: { label: 'Podcast', icon: '🎙️', color: '#f59e0b', progressUnit: 'episodes' },
  custom: { label: 'Custom', icon: '✨', color: '#a8a8c0', progressUnit: 'percent' },
}

export const ITEM_STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: '#a8a8c0', bg: 'rgba(168,168,192,0.12)' },
  in_progress: { label: 'In Progress', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  completed: { label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  dropped: { label: 'Dropped', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  wishlist: { label: 'Wishlist', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
}

export const GOAL_CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: string; color: string }> = {
  personal: { label: 'Personal', icon: '🌱', color: '#34d399' },
  health: { label: 'Health', icon: '💪', color: '#f87171' },
  career: { label: 'Career', icon: '🚀', color: '#7c6af7' },
  learning: { label: 'Learning', icon: '📚', color: '#f59e0b' },
  finance: { label: 'Finance', icon: '💰', color: '#34d399' },
  relationships: { label: 'Relationships', icon: '❤️', color: '#f87171' },
  creative: { label: 'Creative', icon: '🎨', color: '#38bdf8' },
  other: { label: 'Other', icon: '✨', color: '#a8a8c0' },
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible', 2: 'Very Bad', 3: 'Bad', 4: 'Low',
  5: 'Okay', 6: 'Good', 7: 'Good+', 8: 'Great',
  9: 'Excellent', 10: 'Amazing',
}

export const MOOD_EMOJI: Record<number, string> = {
  1: '😭', 2: '😢', 3: '😞', 4: '😕',
  5: '😐', 6: '🙂', 7: '😊', 8: '😄',
  9: '🤩', 10: '🥳',
}

export const MOOD_COLOR = (mood: number): string => {
  if (mood <= 3) return '#f87171'
  if (mood <= 5) return '#f59e0b'
  if (mood <= 7) return '#38bdf8'
  return '#34d399'
}

// ============================================================
// Progress utilities
// ============================================================
export const calculateProgress = (current: number, total?: number | null): number => {
  if (!total || total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

// ============================================================
// Streak calculation
// ============================================================
export const calculateStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0

  const sorted = [...completedDates].sort((a, b) => b.localeCompare(a))
  const todayStr = today()

  let streak = 0
  let currentDate = todayStr

  for (const date of sorted) {
    if (date === currentDate) {
      streak++
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 1)
      currentDate = d.toISOString().split('T')[0]
    } else if (date < currentDate) {
      // Check if we missed yesterday (allow today to not be completed yet)
      if (streak === 0 && date === getPreviousDay(todayStr)) {
        streak++
        const d = new Date(date)
        d.setDate(d.getDate() - 1)
        currentDate = d.toISOString().split('T')[0]
      } else {
        break
      }
    }
  }

  return streak
}

const getPreviousDay = (dateStr: string): string => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

// ============================================================
// Export utilities
// ============================================================
export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${filename}.json`)
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (Array.isArray(val)) return `"${val.join(', ')}"`
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`
      return val ?? ''
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadBlob(blob, `${filename}.csv`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// Misc utilities
// ============================================================
export const cls = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ')

export const truncate = (str: string, length: number): string =>
  str.length > length ? str.slice(0, length) + '…' : str

export const generateId = (): string => crypto.randomUUID()

export const getRatingColor = (rating: number): string => {
  if (rating >= 9) return '#34d399'
  if (rating >= 7) return '#38bdf8'
  if (rating >= 5) return '#f59e0b'
  return '#f87171'
}

export const pluralize = (count: number, word: string, plural?: string): string =>
  `${count} ${count === 1 ? word : (plural || word + 's')}`
