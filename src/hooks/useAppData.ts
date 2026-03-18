import { useEffect, useRef } from 'react'
import {
  useItemsStore, useJournalStore, useHabitsStore, useGoalsStore,
  useNotesStore, useExpensesStore, useOccasionsStore, useHealthStore,
  useBookmarksStore, useTasksStore, useWeeklyReviewStore,
} from '@/lib/store'

/**
 * Fire-and-forget prefetch on login.
 * Pages still do their own fetch — this just warms the cache early.
 */
export function useAppData(isAuthenticated: boolean) {
  const fired = useRef(false)

  const { fetchItems }    = useItemsStore()
  const { fetchLogs: fetchJournal } = useJournalStore()
  const { fetchHabits, fetchLogs: fetchHabitLogs } = useHabitsStore()
  const { fetchGoals }    = useGoalsStore()
  const { fetchNotes }    = useNotesStore()
  const { fetchExpenses } = useExpensesStore()
  const { fetchOccasions }= useOccasionsStore()
  const { fetchRecent }   = useHealthStore()
  const { fetchBookmarks }= useBookmarksStore()
  const { fetchTasks }    = useTasksStore()
  const { fetchReviews }  = useWeeklyReviewStore()

  useEffect(() => {
    if (!isAuthenticated || fired.current) return
    fired.current = true
    // Prefetch in background — errors are swallowed intentionally
    Promise.allSettled([
      fetchItems(),
      fetchJournal(365),
      fetchHabits(),
      fetchHabitLogs(60),
      fetchGoals(),
      fetchNotes(),
      fetchExpenses(),
      fetchOccasions(),
      fetchRecent(30),
      fetchBookmarks(),
      fetchTasks(),
      fetchReviews(),
    ])
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps
}