'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TagInput } from '@/components/ui/TagInput';
import { cn, TYPE_COLORS, STATUS_COLORS, copyToClipboard, formatTestCaseForCopy } from '@/lib/utils';
import type { TestCase, TestCaseType, TestCaseStatus } from '@/types';

interface TestCaseCardProps {
  tc: TestCase;
  suiteId: string;
}

export function TestCaseCard({ tc, suiteId }: TestCaseCardProps) {
  const updateTestCase = useStore(s => s.updateTestCase);
  const deleteTestCase = useStore(s => s.deleteTestCase);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const update = (data: Partial<TestCase>) => updateTestCase(suiteId, tc.id, data);

  const handleCopy = async () => {
    await copyToClipboard(formatTestCaseForCopy(tc));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const typeColors = TYPE_COLORS[tc.type];
  const statusColors = STATUS_COLORS[tc.status];

  const addStep = () => update({ steps: [...tc.steps, ''] });
  const removeStep = (i: number) => update({ steps: tc.steps.filter((_, idx) => idx !== i) });
  const updateStep = (i: number, v: string) => {
    const steps = [...tc.steps];
    steps[i] = v;
    update({ steps });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border border-slate-200 rounded-xl overflow-hidden transition-shadow',
        isDragging && 'shadow-xl border-indigo-300',
        expanded && 'shadow-sm'
      )}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 -m-1 shrink-0 touch-none"
          onClick={e => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
          </svg>
        </button>

        <Badge className={cn('shrink-0 font-mono', typeColors.bg, typeColors.text)}>
          {tc.id}
        </Badge>

        <select
          value={tc.type}
          onChange={e => { e.stopPropagation(); update({ type: e.target.value as TestCaseType }); }}
          onClick={e => e.stopPropagation()}
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-md border shrink-0 cursor-pointer',
            'focus:outline-none focus:ring-1 focus:ring-indigo-300',
            typeColors.bg, typeColors.text, typeColors.border
          )}
        >
          <option value="positive">positive</option>
          <option value="negative">negative</option>
          <option value="boundary">boundary</option>
        </select>

        <select
          value={tc.status}
          onChange={e => { e.stopPropagation(); update({ status: e.target.value as TestCaseStatus }); }}
          onClick={e => e.stopPropagation()}
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-md border-0 shrink-0 cursor-pointer',
            'focus:outline-none focus:ring-1 focus:ring-indigo-300',
            statusColors.bg, statusColors.text
          )}
        >
          <option value="draft">draft</option>
          <option value="ready">ready</option>
          <option value="in-review">in-review</option>
          <option value="approved">approved</option>
        </select>

        <span className="flex-1 text-sm font-medium text-slate-700 truncate min-w-0">{tc.title || 'Untitled'}</span>

        {/* Tags preview */}
        {tc.tags?.length > 0 && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {tc.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">{tag}</span>
            ))}
            {tc.tags.length > 2 && <span className="text-[10px] text-slate-400">+{tc.tags.length - 2}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1.5 rounded-lg text-xs transition-colors',
              copied
                ? 'bg-emerald-50 text-emerald-600'
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
            )}
            aria-label="Copy test case"
          >
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="4.5" y="1.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1.5" y="3.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="white"/>
              </svg>
            )}
          </button>
          <button
            onClick={() => { if (confirm('Delete this test case?')) deleteTestCase(suiteId, tc.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
            aria-label="Delete test case"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 3.5h9M4.5 3.5V2.5h4v1M5.5 5.5v4M7.5 5.5v4M3 3.5l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={cn('text-slate-300 transition-transform duration-200', expanded && 'rotate-180')}
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3 pb-4 pt-1 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Title</label>
              <input
                defaultValue={tc.title}
                onChange={e => update({ title: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                placeholder="Test case title"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Precondition</label>
              <input
                defaultValue={tc.precondition}
                onChange={e => update({ precondition: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                placeholder="e.g. User is logged in"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Steps</label>
              <div className="space-y-1.5">
                {tc.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <input
                      defaultValue={step}
                      onChange={e => updateStep(i, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                      placeholder={`Step ${i + 1}`}
                    />
                    {tc.steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-400 transition-colors p-1" aria-label="Remove step">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addStep} className="text-xs">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Add step
                </Button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Expected Result</label>
              <textarea
                defaultValue={tc.expectedResult}
                onChange={e => update({ expectedResult: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                placeholder="What should happen"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tags</label>
              <TagInput
                tags={tc.tags ?? []}
                onChange={tags => update({ tags })}
                placeholder="Add tag and press Enter…"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}