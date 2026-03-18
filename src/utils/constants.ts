import type { ItemType, ItemStatus, GoalCategory, GoalStatus, ProgressUnit } from '@/types'

export const ITEM_TYPES: { value: ItemType; label: string; icon: string }[] = [
  { value: 'book', label: 'Book', icon: '📚' },
  { value: 'movie', label: 'Movie', icon: '🎬' },
  { value: 'tv_show', label: 'TV Show', icon: '📺' },
  { value: 'course', label: 'Course', icon: '🎓' },
  { value: 'article', label: 'Article', icon: '📄' },
  { value: 'podcast', label: 'Podcast', icon: '🎙️' },
  { value: 'custom', label: 'Custom', icon: '✨' },
]

export const ITEM_STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'wishlist', label: 'Wishlist' },
]

export const PROGRESS_UNITS: { value: ProgressUnit; label: string }[] = [
  { value: 'pages', label: 'Pages' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'episodes', label: 'Episodes' },
  { value: 'chapters', label: 'Chapters' },
  { value: 'percent', label: 'Percent (%)' },
  { value: 'lessons', label: 'Lessons' },
]

export const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: string }[] = [
  { value: 'personal', label: 'Personal', icon: '🌱' },
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'career', label: 'Career', icon: '🚀' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'relationships', label: 'Relationships', icon: '❤️' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '✨' },
]

export const GOAL_STATUSES: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'abandoned', label: 'Abandoned' },
]

export const HABIT_ICONS = [
  '✓', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '✍️', '🎯',
  '🧹', '📝', '🎨', '🎵', '💻', '🌿', '☀️', '🌙', '🙏', '📵',
  '🔍', '💊', '🏋️', '🚴', '🧠', '❤️', '🌊', '🎭', '📷', '🍵',
]

export const HABIT_COLORS = [
  '#7c6af7', '#34d399', '#f59e0b', '#f87171', '#38bdf8',
  '#a78bfa', '#6ee7b7', '#fcd34d', '#fca5a5', '#7dd3fc',
  '#c084fc', '#86efac', '#fde68a', '#fecaca', '#bae6fd',
]

export const RATING_LABELS: Record<number, string> = {
  1: 'Avoid', 2: 'Poor', 3: 'Bad', 4: 'Below Average', 5: 'Average',
  6: 'Good', 7: 'Very Good', 8: 'Great', 9: 'Excellent', 10: 'Masterpiece',
}

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/library', label: 'Library', icon: 'Library' },
  { path: '/journal', label: 'Journal', icon: 'BookOpen' },
  { path: '/habits', label: 'Habits', icon: 'CheckSquare' },
  { path: '/goals', label: 'Goals', icon: 'Target' },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart2' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
] as const

export const AUTH_SESSION_KEY = 'life-os-auth'
export const AUTH_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
