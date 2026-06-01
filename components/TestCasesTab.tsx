'use client';

import { useState, useMemo } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore, useActiveSuite } from '@/store';
import { TestCaseCard } from '@/components/TestCaseCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { TestCaseType, TestCaseStatus } from '@/types';

const TYPE_FILTERS: { label: string; value: 'all' | TestCaseType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Positive', value: 'positive' },
  { label: 'Negative', value: 'negative' },
  { label: 'Boundary', value: 'boundary' },
];

const STATUS_FILTERS: { label: string; value: 'all' | TestCaseStatus }[] = [
  { label: 'All status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Ready', value: 'ready' },
  { label: 'In Review', value: 'in-review' },
  { label: 'Approved', value: 'approved' },
];

const restrictToVerticalAxis = ({ transform }: any) => ({
  ...transform,
  x: 0,
});

export function TestCasesTab() {
  const suite = useActiveSuite();
  const addTestCase = useStore(s => s.addTestCase);
  const reorderTestCases = useStore(s => s.reorderTestCases);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TestCaseType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TestCaseStatus>('all');
  const [tagFilter, setTagFilter] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    suite?.testCases.forEach(tc => tc.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [suite?.testCases]);

  const sortedCases = useMemo(() =>
    [...(suite?.testCases ?? [])].sort((a, b) => a.order - b.order),
    [suite?.testCases]
  );

  const filtered = useMemo(() => {
    return sortedCases.filter(tc => {
      if (typeFilter !== 'all' && tc.type !== typeFilter) return false;
      if (statusFilter !== 'all' && tc.status !== statusFilter) return false;
      if (tagFilter && !tc.tags?.includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return tc.title?.toLowerCase().includes(q) ||
          tc.expectedResult?.toLowerCase().includes(q) ||
          tc.id?.toLowerCase().includes(q) ||
          tc.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [sortedCases, typeFilter, statusFilter, tagFilter, search]);

  if (!suite) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = filtered.map(tc => tc.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, String(active.id));
    const allIds = sortedCases.map(tc => tc.id);
    const filteredSet = new Set(ids);
    let fi = 0;
    const result = allIds.map(id => filteredSet.has(id) ? reordered[fi++] : id);
    reorderTestCases(suite.id, result);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, tag, or ID…"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
          />
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                typeFilter === f.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | TestCaseStatus)}
          className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white"
        >
          {STATUS_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white"
          >
            <option value="">All tags</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        )}

        <Button variant="primary" size="sm" onClick={() => addTestCase(suite.id)} className="ml-auto shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add test case
        </Button>
      </div>

      {/* Results count */}
      {(search || typeFilter !== 'all' || statusFilter !== 'all' || tagFilter) && (
        <p className="text-xs text-slate-500 mb-2">
          Showing {filtered.length} of {suite.testCases.length} test cases
          {(search || typeFilter !== 'all' || statusFilter !== 'all' || tagFilter) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setTagFilter(''); }}
              className="ml-2 text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* Test case list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3 text-slate-200">
            <rect x="6" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 20h12M14 25h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium">No test cases found</p>
          <p className="text-xs mt-1">Generate from requirements or add manually</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={filtered.map(tc => tc.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filtered.map(tc => (
                <TestCaseCard key={tc.id} tc={tc} suiteId={suite.id} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}