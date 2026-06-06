'use client';

import { useState } from 'react';
import { useActiveSuite } from '@/store';
import { cn } from '@/lib/utils';
import type { BugReport, BugSeverity, BugStatus, BugPriority } from '@/types/bug';

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  low: 'bg-green-100 text-green-700 border-green-300',
}

const STATUS_COLORS = {
  open: 'bg-red-50 text-red-600',
  'in-progress': 'bg-blue-50 text-blue-600',
  resolved: 'bg-green-50 text-green-600',
  closed: 'bg-slate-50 text-slate-600',
}

const emptyBug = (): Omit<BugReport, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  description: '',
  severity: 'medium',
  priority: 'medium',
  status: 'open',
  stepsToReproduce: [''],
  expectedResult: '',
  actualResult: '',
  environment: 'Staging',
  assignee: '',
  relatedTestCaseId: '',
  notes: '',
})

export function BugReportPanel() {
  const suite = useActiveSuite();
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyBug())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<BugStatus | 'all'>('all')

  const updateForm = (data: Partial<typeof form>) => setForm(f => ({ ...f, ...data }))

  const addStep = () => updateForm({ stepsToReproduce: [...form.stepsToReproduce, ''] })
  const removeStep = (i: number) => updateForm({ stepsToReproduce: form.stepsToReproduce.filter((_, idx) => idx !== i) })
  const updateStep = (i: number, v: string) => {
    const steps = [...form.stepsToReproduce]
    steps[i] = v
    updateForm({ stepsToReproduce: steps })
  }

  const saveBug = () => {
    if (!form.title.trim()) return
    const now = new Date().toISOString()
    if (editingId) {
      setBugs(bugs.map(b => b.id === editingId ? { ...form, id: editingId, createdAt: b.createdAt, updatedAt: now } : b))
      setEditingId(null)
    } else {
      const newBug: BugReport = {
        ...form,
        id: `BUG-${String(bugs.length + 1).padStart(3, '0')}`,
        createdAt: now,
        updatedAt: now,
      }
      setBugs([...bugs, newBug])
    }
    setForm(emptyBug())
    setShowForm(false)
  }

  const deleteBug = (id: string) => {
    if (confirm('Delete this bug report?')) setBugs(bugs.filter(b => b.id !== id))
  }

  const editBug = (bug: BugReport) => {
    setForm(bug)
    setEditingId(bug.id)
    setShowForm(true)
  }

  const exportBugs = () => {
    const csv = [
      ['ID', 'Title', 'Severity', 'Priority', 'Status', 'Environment', 'Assignee', 'Steps', 'Expected', 'Actual', 'Created'].join(','),
      ...bugs.map(b => [
        b.id, `"${b.title}"`, b.severity, b.priority, b.status,
        b.environment, b.assignee,
        `"${b.stepsToReproduce.join(' | ')}"`,
        `"${b.expectedResult}"`, `"${b.actualResult}"`,
        b.createdAt
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bug-reports-${suite?.name ?? 'export'}.csv`
    a.click()
  }

  const filteredBugs = filter === 'all' ? bugs : bugs.filter(b => b.status === filter)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800">🐛 Bug Reports</h2>
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
            {bugs.filter(b => b.status === 'open').length} open
          </span>
        </div>
        <div className="flex gap-2">
          {bugs.length > 0 && (
            <button
              onClick={exportBugs}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            >
              Export CSV
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyBug()) }}
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            + New Bug
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {bugs.length > 0 && (
        <div className="flex gap-1">
          {(['all', 'open', 'in-progress', 'resolved', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-xs rounded-lg transition-colors capitalize',
                filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Bug Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">
            {editingId ? 'Edit Bug Report' : 'New Bug Report'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Title *</label>
              <input
                value={form.title}
                onChange={e => updateForm({ title: e.target.value })}
                placeholder="Brief description of the bug"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => updateForm({ description: e.target.value })}
                rows={2}
                placeholder="Detailed description"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={e => updateForm({ severity: e.target.value as BugSeverity })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              >
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => updateForm({ priority: e.target.value as BugPriority })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              >
                <option value="urgent">🚨 Urgent</option>
                <option value="high">⬆️ High</option>
                <option value="medium">➡️ Medium</option>
                <option value="low">⬇️ Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => updateForm({ status: e.target.value as BugStatus })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Environment</label>
              <select
                value={form.environment}
                onChange={e => updateForm({ environment: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              >
                {['Staging', 'Production', 'Local', 'QA', 'Dev', 'UAT'].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Assignee</label>
              <input
                value={form.assignee}
                onChange={e => updateForm({ assignee: e.target.value })}
                placeholder="Who should fix this?"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Related Test Case</label>
              <select
                value={form.relatedTestCaseId}
                onChange={e => updateForm({ relatedTestCaseId: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
              >
                <option value="">None</option>
                {suite?.testCases.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.id} - {tc.title}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Steps to Reproduce</label>
              <div className="space-y-1.5">
                {form.stepsToReproduce.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <input
                      value={step}
                      onChange={e => updateStep(i, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
                      placeholder={`Step ${i + 1}`}
                    />
                    {form.stepsToReproduce.length > 1 && (
                      <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-400 p-1">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={addStep} className="text-xs text-indigo-600 hover:underline mt-1">+ Add step</button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Expected Result</label>
              <textarea
                value={form.expectedResult}
                onChange={e => updateForm({ expectedResult: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400 resize-none"
                placeholder="What should happen"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Actual Result</label>
              <textarea
                value={form.actualResult}
                onChange={e => updateForm({ actualResult: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400 resize-none"
                placeholder="What actually happened"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => updateForm({ notes: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400 resize-none"
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
            <button onClick={saveBug} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
              {editingId ? 'Save Changes' : 'Submit Bug'}
            </button>
          </div>
        </div>
      )}

      {/* Bug List */}
      {filteredBugs.length === 0 && !showForm ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-2xl mb-2">🐛</p>
          <p className="text-sm font-medium">No bugs reported yet</p>
          <p className="text-xs mt-1">Click "+ New Bug" to report one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBugs.map(bug => (
            <div key={bug.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-mono font-bold text-slate-400 shrink-0">{bug.id}</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', SEVERITY_COLORS[bug.severity])}>
                  {bug.severity.toUpperCase()}
                </span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[bug.status])}>
                  {bug.status}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{bug.title}</span>
                <span className="text-xs text-slate-400 shrink-0">{bug.environment}</span>
                {bug.assignee && <span className="text-xs text-indigo-600 shrink-0">{bug.assignee}</span>}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => editBug(bug)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">✏️</button>
                  <button onClick={() => deleteBug(bug.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500">🗑️</button>
                </div>
              </div>
              {bug.description && (
                <div className="px-4 pb-3 text-xs text-slate-500">{bug.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}