import type { Project } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppState, TestSuite, TestCase, TestRun, RunResult,
  TestCaseStatus, GenerateResponse, ChatMessage,
} from '@/types';
import { BugReport } from '@/types/bug';

interface StoreActions {
  // Projects
  createProject: (name: string, description?: string) => string;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  // Suite
  createSuite: (name: string, description?: string, projectId?: string) => string;
  updateSuite: (id: string, data: Partial<Pick<TestSuite, 'name' | 'description' | 'requirements' | 'userStories' | 'tags'>>) => void;
  deleteSuite: (id: string) => void;
  setActiveSuite: (id: string | null) => void;
  setGeneratedData: (suiteId: string, data: GenerateResponse) => void;

  // Test Cases
  addTestCase: (suiteId: string) => string;
  updateTestCase: (suiteId: string, tcId: string, data: Partial<TestCase>) => void;
  deleteTestCase: (suiteId: string, tcId: string) => void;
  reorderTestCases: (suiteId: string, orderedIds: string[]) => void;

  // Runs
  createRun: (suiteId: string, name: string, tester: string, environment: string) => string;
  setRunResult: (suiteId: string, runId: string, tcId: string, result: Partial<RunResult>) => void;
  completeRun: (suiteId: string, runId: string) => void;
  deleteRun: (suiteId: string, runId: string) => void;

  // Bugs
  addBug: (suiteId: string, bug: BugReport) => void;
  updateBug: (suiteId: string, bugId: string, data: Partial<BugReport>) => void;
  deleteBug: (suiteId: string, bugId: string) => void;

  // Chat
  setChatMessages: (suiteId: string, messages: ChatMessage[]) => void;
  clearChat: (suiteId: string) => void;

  // Export
  exportSuiteToJSON: (suiteId: string) => void;
}

type Store = AppState & StoreActions;

const now = () => Date.now();

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      suites: [],
      activeSuiteId: null,

      createProject: (name, description = '') => {
        const id = uuidv4();
        const project: Project = {
          id, name, description,
          ownerId: '',
          createdAt: now(),
          updatedAt: now(),
        };
        set(s => ({ projects: [...s.projects, project], activeProjectId: id }));
        return id;
      },

      updateProject: (id, data) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          suites: s.suites.filter(suite => suite.projectId !== id),
          activeProjectId: s.activeProjectId === id
            ? (s.projects.find(p => p.id !== id)?.id ?? null)
            : s.activeProjectId,
        }));
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      createSuite: (name, description = '', projectId) => {
        const id = uuidv4();
        const suite: TestSuite = {
          id, name, description,
          projectId,
          requirements: '', userStories: '',
          testCases: [], edgeCases: [], gaps: [],
          acceptanceCriteria: [], runs: [], tags: [],
          bugs: [], chatMessages: [],
          createdAt: now(), updatedAt: now(),
        };
        set(s => ({ suites: [...s.suites, suite], activeSuiteId: id }));
        return id;
      },

      updateSuite: (id, data) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id === id ? { ...suite, ...data, updatedAt: now() } : suite
          ),
        }));
      },

      deleteSuite: (id) => {
        set(s => {
          const suites = s.suites.filter(suite => suite.id !== id);
          const activeSuiteId = s.activeSuiteId === id
            ? (suites[0]?.id ?? null)
            : s.activeSuiteId;
          return { suites, activeSuiteId };
        });
      },

      setActiveSuite: (id) => set({ activeSuiteId: id }),

      setGeneratedData: (suiteId, data) => {
        set(s => ({
          suites: s.suites.map(suite => {
            if (suite.id !== suiteId) return suite;
            const testCases: TestCase[] = data.testCases.map((tc, i) => ({
              ...tc,
              status: 'ready' as TestCaseStatus,
              tags: [],
              order: i,
              createdAt: now(),
              updatedAt: now(),
            }));
            return {
              ...suite,
              testCases,
              edgeCases: data.edgeCases,
              gaps: data.gaps,
              acceptanceCriteria: data.acceptanceCriteria,
              updatedAt: now(),
            };
          }),
        }));
      },

      addTestCase: (suiteId) => {
        const id = uuidv4();
        const suite = get().suites.find(s => s.id === suiteId);
        const order = (suite?.testCases.length ?? 0);
        const tc: TestCase = {
          id,
          title: 'New test case',
          type: 'positive',
          status: 'draft',
          precondition: '',
          steps: [''],
          expectedResult: '',
          tags: [],
          order,
          createdAt: now(),
          updatedAt: now(),
        };
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id === suiteId
              ? { ...suite, testCases: [...suite.testCases, tc], updatedAt: now() }
              : suite
          ),
        }));
        return id;
      },

      updateTestCase: (suiteId, tcId, data) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              testCases: suite.testCases.map(tc =>
                tc.id === tcId ? { ...tc, ...data, updatedAt: now() } : tc
              ),
              updatedAt: now(),
            }
          ),
        }));
      },

      deleteTestCase: (suiteId, tcId) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              testCases: suite.testCases.filter(tc => tc.id !== tcId),
              updatedAt: now(),
            }
          ),
        }));
      },

      reorderTestCases: (suiteId, orderedIds) => {
        set(s => ({
          suites: s.suites.map(suite => {
            if (suite.id !== suiteId) return suite;
            const map = new Map(suite.testCases.map(tc => [tc.id, tc]));
            const testCases = orderedIds
              .map((id, i) => map.get(id) ? { ...map.get(id)!, order: i } : null)
              .filter(Boolean) as TestCase[];
            return { ...suite, testCases, updatedAt: now() };
          }),
        }));
      },

      createRun: (suiteId, name, tester, environment) => {
        const id = uuidv4();
        const suite = get().suites.find(s => s.id === suiteId);
        const results: Record<string, RunResult> = {};
        suite?.testCases.forEach(tc => {
          results[tc.id] = { status: 'untested', note: '' };
        });
        const run: TestRun = {
          id, name, tester, environment,
          status: 'inprogress',
          results,
          startedAt: now(),
          completedAt: null,
        };
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              runs: [run, ...suite.runs],
              updatedAt: now(),
            }
          ),
        }));
        return id;
      },

      setRunResult: (suiteId, runId, tcId, result) => {
        set(s => ({
          suites: s.suites.map(suite => {
            if (suite.id !== suiteId) return suite;
            const runs = suite.runs.map(run => {
              if (run.id !== runId) return run;
              const results = {
                ...run.results,
                [tcId]: { ...run.results[tcId], ...result },
              };
              const allDone = Object.values(results).every(r => r.status !== 'untested');
              return {
                ...run,
                results,
                status: allDone ? 'completed' as const : run.status,
                completedAt: allDone && !run.completedAt ? now() : run.completedAt,
              };
            });
            return { ...suite, runs, updatedAt: now() };
          }),
        }));
      },

      completeRun: (suiteId, runId) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              runs: suite.runs.map(run =>
                run.id !== runId ? run : {
                  ...run, status: 'completed', completedAt: now(),
                }
              ),
              updatedAt: now(),
            }
          ),
        }));
      },

      deleteRun: (suiteId, runId) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              runs: suite.runs.filter(r => r.id !== runId),
              updatedAt: now(),
            }
          ),
        }));
      },

      addBug: (suiteId, bug) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              bugs: [...(suite.bugs ?? []), bug],
              updatedAt: now(),
            }
          ),
        }));
      },

      updateBug: (suiteId, bugId, data) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              bugs: (suite.bugs ?? []).map(b =>
                b.id === bugId ? { ...b, ...data, updatedAt: new Date().toISOString() } : b
              ),
              updatedAt: now(),
            }
          ),
        }));
      },

      deleteBug: (suiteId, bugId) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              bugs: (suite.bugs ?? []).filter(b => b.id !== bugId),
              updatedAt: now(),
            }
          ),
        }));
      },

      setChatMessages: (suiteId, messages) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              chatMessages: messages,
              updatedAt: now(),
            }
          ),
        }));
      },

      clearChat: (suiteId) => {
        set(s => ({
          suites: s.suites.map(suite =>
            suite.id !== suiteId ? suite : {
              ...suite,
              chatMessages: [],
              updatedAt: now(),
            }
          ),
        }));
      },

      exportSuiteToJSON: (suiteId) => {
        const suite = get().suites.find(s => s.id === suiteId);
        if (!suite) return;
        const blob = new Blob([JSON.stringify(suite, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${suite.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'qa-studio-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useActiveSuite = () => {
  const suites = useStore(s => s.suites);
  const activeSuiteId = useStore(s => s.activeSuiteId);
  return suites.find(s => s.id === activeSuiteId) ?? null;
};

export const useActiveProject = () => {
  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  return projects.find(p => p.id === activeProjectId) ?? null;
};

export const useRunStats = (run: TestRun | undefined) => {
  if (!run) return null;
  const vals = Object.values(run.results);
  const pass = vals.filter(r => r.status === 'pass').length;
  const fail = vals.filter(r => r.status === 'fail').length;
  const blocked = vals.filter(r => r.status === 'blocked').length;
  const skipped = vals.filter(r => r.status === 'skipped').length;
  const untested = vals.filter(r => r.status === 'untested').length;
  const total = vals.length;
  return { pass, fail, blocked, skipped, untested, total, passRate: total ? Math.round(pass / total * 100) : 0 };
};