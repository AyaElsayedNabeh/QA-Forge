import type { TestRun } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getRunStats(run: TestRun) {
  const vals = Object.values(run.results ?? {});
  const pass = vals.filter(r => r.status === 'pass').length;
  const fail = vals.filter(r => r.status === 'fail').length;
  const blocked = vals.filter(r => r.status === 'blocked').length;
  const skipped = vals.filter(r => r.status === 'skipped').length;
  const untested = vals.filter(r => r.status === 'untested').length;
  const total = vals.length;
  return {
    pass, fail, blocked, skipped, untested, total,
    passRate: total ? Math.round(pass / total * 100) : 0,
    progress: total ? Math.round((total - untested) / total * 100) : 0,
  };
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function formatTestCaseForCopy(tc: import('@/types').TestCase): string {
  return [
    `Test Case: ${tc.id}`,
    `Title: ${tc.title}`,
    `Type: ${tc.type}`,
    `Status: ${tc.status}`,
    `Precondition: ${tc.precondition}`,
    `Steps:\n${(tc.steps ?? []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
    `Expected Result: ${tc.expectedResult}`,
    tc.tags?.length ? `Tags: ${tc.tags.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

export const TYPE_COLORS = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  negative: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  boundary: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
} as const;

export const STATUS_COLORS = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600' },
  ready: { bg: 'bg-blue-50', text: 'text-blue-700' },
  'in-review': { bg: 'bg-violet-50', text: 'text-violet-700' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
} as const;

export const RUN_RESULT_COLORS = {
  untested: 'bg-slate-100 text-slate-500 border-slate-200',
  pass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  fail: 'bg-red-100 text-red-700 border-red-300',
  blocked: 'bg-amber-100 text-amber-700 border-amber-300',
  skipped: 'bg-slate-200 text-slate-500 border-slate-300',
} as const;

export const SEVERITY_COLORS = {
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-red-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-400' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
} as const;

export const ENVIRONMENTS = ['Staging', 'Production', 'Local', 'QA', 'Dev', 'UAT'];

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}