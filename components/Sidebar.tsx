'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const suites = useStore(s => s.suites);
  const activeSuiteId = useStore(s => s.activeSuiteId);
  const createSuite = useStore(s => s.createSuite);
  const deleteSuite = useStore(s => s.deleteSuite);
  const setActiveSuite = useStore(s => s.setActiveSuite);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createSuite(name.trim(), desc.trim());
    setName(''); setDesc('');
    setShowCreate(false);
  };

  return (
    <>
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Test Suites</p>
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => setShowCreate(true)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New suite
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {suites.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6 px-2">No suites yet. Create one to get started.</p>
          )}
          {suites.map(suite => (
            <div
              key={suite.id}
              className={cn(
                'group flex items-center gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer',
                'transition-colors duration-100',
                suite.id === activeSuiteId
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-white text-slate-600 hover:text-slate-800'
              )}
              onClick={() => setActiveSuite(suite.id)}
            >
              <div className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                suite.id === activeSuiteId ? 'bg-indigo-300' : 'bg-slate-300'
              )} />
              <span className="flex-1 text-xs font-medium truncate">{suite.name}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full shrink-0',
                suite.id === activeSuiteId
                  ? 'bg-indigo-500 text-indigo-100'
                  : 'bg-slate-200 text-slate-500'
              )}>
                {suite.testCases.length}
              </span>
              <button
                onClick={e => { e.stopPropagation(); if (confirm(`Delete "${suite.name}"?`)) deleteSuite(suite.id); }}
                className={cn(
                  'opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all',
                  suite.id === activeSuiteId
                    ? 'hover:bg-indigo-500 text-indigo-200'
                    : 'hover:bg-red-100 text-slate-400 hover:text-red-500'
                )}
                aria-label="Delete suite"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M9 2L2 9M2 2l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New test suite">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Suite name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. User Authentication"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={!name.trim()}>Create suite</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}