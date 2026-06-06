'use client';

import { MultiAgent } from '@/components/MultiAgent';
import { BotManager } from '@/components/BotManager';
import { useEffect, useState } from 'react';
import { useStore, useActiveSuite } from '@/store';
import { Sidebar } from '@/components/Sidebar';
import { RequirementsPanel } from '@/components/RequirementsPanel';
import { TestCasesTab } from '@/components/TestCasesTab';
import { useSaveStatus } from '@/hooks/useSaveStatus';
import { useApiSync } from '@/hooks/useApiSync';
import { cn, formatDate, getRunStats } from '@/lib/utils';

const TABS = [
  { id: 'testcases', label: 'Test Cases' },
  { id: 'runs',      label: 'Test Runs' },
  { id: 'history',   label: 'Run History' },
  { id: 'edge',      label: 'Edge Cases' },
  { id: 'gaps',      label: 'Gaps' },
  { id: 'ac',        label: 'Acceptance Criteria' },
  { id: 'bot',       label: '🤖 QA Bot' },
  { id: 'multiagent', label: '🤖 Multi-Agent' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const suite = useActiveSuite();
  const exportSuiteToJSON = useStore(s => s.exportSuiteToJSON);
  const createRun = useStore(s => s.createRun);
  const setRunResult = useStore(s => s.setRunResult);
  const completeRun = useStore(s => s.completeRun);
  const deleteRun = useStore(s => s.deleteRun);
  const saveStatus = useSaveStatus();
  const [tab, setTab] = useState<TabId>('testcases');
  const [showNewRun, setShowNewRun] = useState(false);
  const [runName, setRunName] = useState('');
  const [runTester, setRunTester] = useState('');
  const [runEnv, setRunEnv] = useState('Staging');
  const [mounted, setMounted] = useState(false);

  // Enable optional API sync (set to true to also persist to data/suites.json)
  useApiSync(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleCreateRun = () => {
    if (!suite || !suite.testCases.length) return;
    createRun(suite.id, runName || 'Test run', runTester || 'Tester', runEnv);
    setRunName(''); setRunTester(''); setRunEnv('Staging');
    setShowNewRun(false);
    setTab('runs');
  };

  const activeRuns = suite?.runs.filter(r => r.status !== 'completed') ?? [];
  const completedRuns = suite?.runs.filter(r => r.status === 'completed') ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {!suite ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 text-slate-200">
              <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 24h16M16 30h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm font-medium">Select or create a test suite to get started</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-5">

            {/* Topbar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-slate-800">{suite.name}</h1>
                {suite.description && <p className="text-xs text-slate-500 mt-0.5">{suite.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs flex items-center gap-1 transition-colors',
                  saveStatus === 'saved' ? 'text-emerald-600' :
                  saveStatus === 'saving' ? 'text-amber-500' : 'text-slate-400'
                )}>
                  {saveStatus === 'saved' && '✓ Saved'}
                  {saveStatus === 'saving' && '● Saving…'}
                  {saveStatus === 'idle' && '● Auto-save on'}
                </span>
                <button
                  onClick={() => exportSuiteToJSON(suite.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-white text-slate-600 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1.5v7M4 6l2.5 2.5L9 6M2.5 10.5h8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export JSON
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Test Cases', value: suite.testCases.length, color: 'text-indigo-600' },
                { label: 'Test Runs', value: suite.runs.length, color: 'text-slate-700' },
                { label: 'Last Pass Rate', value: completedRuns[0] ? `${getRunStats(completedRuns[0]).passRate}%` : '—', color: 'text-emerald-600' },
                { label: 'Open Failures', value: activeRuns[0] ? Object.values(activeRuns[0].results).filter(r => r.status === 'fail').length : 0, color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
                </div>
              ))}
            </div>

            <RequirementsPanel />

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 mb-4">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  {t.label}
                  {t.id === 'testcases' && suite.testCases.length > 0 && (
                    <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]', tab === t.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500')}>
                      {suite.testCases.length}
                    </span>
                  )}
                  {t.id === 'runs' && activeRuns.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-600">{activeRuns.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {tab === 'testcases' && <TestCasesTab />}

            {tab === 'runs' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-slate-500">Active test runs</p>
                  <button onClick={() => setShowNewRun(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    New test run
                  </button>
                </div>
                {showNewRun && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700">Start new test run</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Run name</label>
                        <input value={runName} onChange={e => setRunName(e.target.value)} placeholder="Sprint 14 regression" className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tester</label>
                        <input value={runTester} onChange={e => setRunTester(e.target.value)} placeholder="Your name" className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Environment</label>
                        <select value={runEnv} onChange={e => setRunEnv(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                          {['Staging','Production','Local','QA','Dev','UAT'].map(e => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowNewRun(false)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
                      <button onClick={handleCreateRun} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Start run</button>
                    </div>
                  </div>
                )}
                {activeRuns.length === 0 && !showNewRun && (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-sm">No active runs. Start one to begin executing test cases.</p>
                  </div>
                )}
                {activeRuns.map(run => {
                  const stats = getRunStats(run);
                  return (
                    <div key={run.id} className="bg-white border-2 border-indigo-200 rounded-xl mb-4 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>
                        <span className="font-semibold text-sm text-slate-800 flex-1">{run.name}</span>
                        <span className="text-xs text-slate-500">{run.tester} · {run.environment}</span>
                        <span className="text-xs font-bold text-emerald-600">{stats.passRate}% pass</span>
                        <button onClick={() => completeRun(suite.id, run.id)} className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Complete</button>
                        <button onClick={() => deleteRun(suite.id, run.id)} className="p-1 text-slate-400 hover:text-red-500 rounded">✕</button>
                      </div>
                      <div className="h-1.5 bg-slate-100">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${stats.progress}%` }}/>
                      </div>
                      <div className="grid grid-cols-4 gap-px bg-slate-100 text-center text-xs font-semibold py-2 px-4">
                        <span className="text-emerald-600">{stats.pass} Pass</span>
                        <span className="text-red-500">{stats.fail} Fail</span>
                        <span className="text-amber-500">{stats.blocked} Blocked</span>
                        <span className="text-slate-400">{stats.untested} Remaining</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {suite.testCases.map(tc => {
                          const res = run.results[tc.id] ?? { status: 'untested', note: '' };
                          return (
                            <div key={tc.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400 w-14 shrink-0">{tc.id}</span>
                              <span className="flex-1 text-sm text-slate-700 truncate">{tc.title}</span>
                              <div className="flex gap-1.5 shrink-0">
                                {(['pass','fail','blocked','skipped'] as const).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setRunResult(suite.id, run.id, tc.id, { status: s })}
                                    className={cn(
                                      'px-2 py-1 text-[10px] font-semibold rounded-md border capitalize transition-colors',
                                      res.status === s ? {
                                        pass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
                                        fail: 'bg-red-100 text-red-700 border-red-300',
                                        blocked: 'bg-amber-100 text-amber-700 border-amber-300',
                                        skipped: 'bg-slate-200 text-slate-500 border-slate-300',
                                      }[s] : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                    )}
                                  >{s}</button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'history' && (
              <div>
                <p className="text-sm text-slate-500 mb-3">Completed runs with pass rate breakdown</p>
                {completedRuns.length === 0 ? (
                  <div className="text-center py-10 text-slate-400"><p className="text-sm">No completed runs yet.</p></div>
                ) : completedRuns.map(run => {
                  const stats = getRunStats(run);
                  const total = stats.total || 1;
                  return (
                    <div key={run.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">{run.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{run.tester} · {run.environment} · {run.completedAt ? formatDate(run.completedAt) : '—'} · {stats.total} cases</p>
                      </div>
                      <div className="flex h-2 w-32 rounded-full overflow-hidden gap-px shrink-0">
                        <div className="bg-emerald-500" style={{ width: `${stats.pass / total * 100}%` }}/>
                        <div className="bg-red-400" style={{ width: `${stats.fail / total * 100}%` }}/>
                        <div className="bg-amber-400" style={{ width: `${stats.blocked / total * 100}%` }}/>
                        <div className="bg-slate-200" style={{ width: `${(stats.skipped + stats.untested) / total * 100}%` }}/>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 w-12 text-right shrink-0">{stats.passRate}%</span>
                      <button onClick={() => deleteRun(suite.id, run.id)} className="text-slate-300 hover:text-red-400 p-1 rounded transition-colors">✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'edge' && (
              <div className="space-y-3">
                {suite.edgeCases.length === 0 ? (
                  <div className="text-center py-10 text-slate-400"><p className="text-sm">Generate from requirements above.</p></div>
                ) : suite.edgeCases.map((ec, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-amber-500"><path d="M7 2L12.5 11.5H1.5L7 2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/><path d="M7 6v2.5M7 10v.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{ec.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ec.description}</p>
                      {ec.recommendation && <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1"><span>💡</span>{ec.recommendation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'gaps' && (
              <div className="space-y-3">
                {suite.gaps.length === 0 ? (
                  <div className="text-center py-10 text-emerald-400"><p className="text-sm font-medium">✓ No gaps detected</p></div>
                ) : suite.gaps.map((gap, i) => (
                 <div key={i} className={`bg-white border border-slate-200 rounded-xl p-4 border-l-4 ${
  gap.severity === 'high' ? 'border-l-red-500' :
  gap.severity === 'medium' ? 'border-l-amber-400' :
  'border-l-emerald-400'
}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
  gap.severity === 'high' ? 'bg-red-100 text-red-700' :
  gap.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
  'bg-emerald-100 text-emerald-700'
}`}>{gap.severity.toUpperCase()}</span>
                      <span className="text-sm font-semibold text-slate-700">{gap.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{gap.description}</p>
                    {gap.suggestion && <div className="mt-2 text-xs bg-slate-50 rounded-lg px-3 py-2 text-slate-600"><strong>Suggestion:</strong> {gap.suggestion}</div>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'ac' && (
              <div className="space-y-3">
                {suite.acceptanceCriteria.length === 0 ? (
                  <div className="text-center py-10 text-slate-400"><p className="text-sm">Generate from requirements above.</p></div>
                ) : suite.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">{ac.scenario}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(`Given ${ac.given}\nWhen ${ac.when}\nThen ${ac.then}`)}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >Copy</button>
                    </div>
                    <div className="text-sm leading-8">
                      <span className="font-semibold text-indigo-600">Given</span> {ac.given}<br/>
                      <span className="font-semibold text-amber-600">When</span> {ac.when}<br/>
                      <span className="font-semibold text-emerald-600">Then</span> {ac.then}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'bot' && <BotManager />}

          </div>
        )}
      </main>
    </div>
  );
}