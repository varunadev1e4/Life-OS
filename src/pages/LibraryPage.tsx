import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useItemsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Select, EmptyState, Skeleton } from '@/components/ui'
import { ItemFormModal } from '@/components/library/ItemFormModal'
import { ItemCard } from '@/components/library/ItemCard'
import { ITEM_TYPES, ITEM_STATUSES } from '@/utils/constants'
import { ITEM_TYPE_CONFIG } from '@/utils/helpers'
import type { ItemType, ItemStatus } from '@/types'

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Added' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
  { value: 'completed_at', label: 'Date Completed' },
]

export function LibraryPage() {
  const [searchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { items, isLoading, fetchItems, filters, setFilters, resetFilters, getFilteredItems, deleteItem } = useItemsStore()
  const { success, error } = useToast()

  useEffect(() => {
    fetchItems()
    // Apply URL params
    const status = searchParams.get('status')
    if (status) setFilters({ status: status as ItemStatus })
  }, [fetchItems, searchParams, setFilters])

  const filtered = getFilteredItems()
  const hasActiveFilters = filters.type !== 'all' || filters.status !== 'all' || filters.rating !== null || filters.tags.length > 0 || filters.search

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id)
      success('Item deleted')
    } catch {
      error('Failed to delete item')
    }
  }

  // Group by type for type-tab view
  const typeCounts = ITEM_TYPES.reduce((acc, t) => {
    acc[t.value] = items.filter(i => i.type === t.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Library"
        subtitle={`${items.length} items tracked`}
        icon="📚"
        action={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Add Item
          </Button>
        }
      />

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button
          onClick={() => setFilters({ type: 'all' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filters.type === 'all'
              ? 'bg-[var(--accent-violet)] text-white'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          All <span className="opacity-70">{items.length}</span>
        </button>
        {ITEM_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilters({ type: t.value as ItemType })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filters.type === t.value
                ? 'text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
            }`}
            style={filters.type === t.value ? { background: ITEM_TYPE_CONFIG[t.value as ItemType].color } : {}}
          >
            {t.icon} {t.label} <span className="opacity-70">{typeCounts[t.value] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search and filters bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search title, author, genre..."
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          {filters.search && (
            <button onClick={() => setFilters({ search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <X size={14} />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<SlidersHorizontal size={14} />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] animate-pulse" />}
        </Button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] grid sm:grid-cols-3 gap-3">
              <Select
                label="Status"
                value={filters.status}
                onChange={e => setFilters({ status: e.target.value as ItemStatus | 'all' })}
                options={[{ value: 'all', label: 'All Status' }, ...ITEM_STATUSES]}
              />
              <Select
                label="Minimum Rating"
                value={String(filters.rating ?? '')}
                onChange={e => setFilters({ rating: e.target.value ? Number(e.target.value) : null })}
                options={[
                  { value: '', label: 'Any Rating' },
                  ...[7, 8, 9, 10].map(r => ({ value: String(r), label: `${r}+ stars` }))
                ]}
              />
              <Select
                label="Sort By"
                value={filters.sortBy}
                onChange={e => setFilters({ sortBy: e.target.value as typeof filters.sortBy })}
                options={SORT_OPTIONS}
              />
              <div className="sm:col-span-3 flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)]">{filtered.length} results</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  >
                    {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={hasActiveFilters ? 'No items match your filters' : 'Your library is empty'}
          description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Start tracking books, movies, courses and more'}
          action={
            <div className="flex gap-2">
              {hasActiveFilters && <Button variant="secondary" onClick={resetFilters}>Clear filters</Button>}
              <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
                Add your first item
              </Button>
            </div>
          }
        />
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </motion.div>
      )}

      <ItemFormModal isOpen={showForm} onClose={() => setShowForm(false)} />
    </div>
  )
}
