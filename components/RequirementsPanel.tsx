'use client';

import { useState, useCallback } from 'react';
import { useStore, useActiveSuite } from '@/store';
import { Button } from '@/components/ui/Button';
import { debounce } from '@/lib/utils';

export function RequirementsPanel() {
  const suite = useActiveSuite();
  const updateSuite = useStore(s => s.updateSuite);
  const setGeneratedData = useStore(s => s.setGeneratedData);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const debouncedUpdate = useCallback(
    debounce((...args: unknown[]): void => {
      const [field, value] = args as [string, string];
      if (suite) updateSuite(suite.id, { [field]: value } as Record<string, string>);
    }, 400),
    [suite?.id]
  );

  if (!suite) return null;

  const handleGenerate = async () => {
    if (!suite.requirements.trim() && !suite.userStories.trim()) {
      setError('Please enter requirements or user stories first.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: suite.requirements, userStories: suite.userStories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedData(suite.id, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
          Requirements &amp; User Stories
        </h2>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="gap-1.5"
        >
          {generating ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L8 4.5l3.5.5-2.5 2.5.5 3.5L6.5 9 3 11l.5-3.5L1 5l3.5-.5L6.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Generate test design
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Software Requirements
          </label>
          <textarea
            defaultValue={suite.requirements}
            onChange={e => debouncedUpdate('requirements', e.target.value)}
            rows={5}
            placeholder="- The system shall allow users to register&#10;- Passwords must be 8+ characters&#10;- Email must be unique"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 leading-relaxed"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            User Stories
          </label>
          <textarea
            defaultValue={suite.userStories}
            onChange={e => debouncedUpdate('userStories', e.target.value)}
            rows={5}
            placeholder="As a new user, I want to register an account&#10;so that I can access the platform.&#10;&#10;As a returning user, I want to log in securely."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 leading-relaxed"
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {generating && (
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      )}
    </div>
  );
}