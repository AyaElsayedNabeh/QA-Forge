'use client';

import { useState } from 'react';
import { useActiveSuite } from '@/store';
import { cn } from '@/lib/utils';

interface AgentResult {
  name: string;
  output: string;
}

interface AgentResults {
  analyzer: AgentResult;
  testDesigner: AgentResult;
  riskAgent: AgentResult;
  reporter: AgentResult;
}

const AGENT_COLORS = {
  analyzer: 'bg-blue-50 border-blue-200 text-blue-700',
  testDesigner: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  riskAgent: 'bg-red-50 border-red-200 text-red-700',
  reporter: 'bg-purple-50 border-purple-200 text-purple-700',
}

export function MultiAgent() {
  const suite = useActiveSuite();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AgentResults | null>(null);
  const [error, setError] = useState('');
  const [activeAgent, setActiveAgent] = useState<keyof AgentResults>('analyzer');
  const [progress, setProgress] = useState(0);

  const runAgents = async () => {
    if (!suite?.requirements && !suite?.userStories) {
      setError('Please add requirements or user stories first.');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 8, 90));
    }, 800);

    try {
      const res = await fetch('/api/multiagent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: suite?.requirements ?? '',
          userStories: suite?.userStories ?? '',
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.agents);
        setProgress(100);
      }
    } catch {
      setError('Failed to run agents. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">🤖 Multi-Agent Analysis</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              4 specialized AI agents will analyze your requirements simultaneously
            </p>
          </div>
          <button
            onClick={runAgents}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
          >
            {loading ? 'Running Agents...' : '▶ Run All Agents'}
          </button>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Agents working...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {['🔍 Analyzing', '🧪 Designing', '🚨 Risk Check', '📊 Reporting'].map((step, i) => (
                <span
                  key={step}
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    progress > i * 25 ? 'text-indigo-600' : 'text-slate-300'
                  )}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Agent tabs */}
          <div className="flex border-b border-slate-200">
            {(Object.keys(results) as (keyof AgentResults)[]).map(key => (
              <button
                key={key}
                onClick={() => setActiveAgent(key)}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
                  activeAgent === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {results[key].name}
              </button>
            ))}
          </div>

          {/* Agent output */}
          <div className={cn('p-4 border-l-4', AGENT_COLORS[activeAgent])}>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
              {results[activeAgent].output}
            </pre>
          </div>

          {/* Copy button */}
          <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigator.clipboard.writeText(results[activeAgent].output)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            >
              Copy Output
            </button>
          </div>
        </div>
      )}
    </div>
  );
}