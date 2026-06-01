export type TestCaseType = 'positive' | 'negative' | 'boundary';
export type TestCaseStatus = 'draft' | 'ready' | 'in-review' | 'approved';
export type RunResultStatus = 'untested' | 'pass' | 'fail' | 'blocked' | 'skipped';
export type RunStatus = 'draft' | 'inprogress' | 'completed';
export type GapSeverity = 'high' | 'medium' | 'low';

export interface TestCase {
  id: string;
  title: string;
  type: TestCaseType;
  status: TestCaseStatus;
  precondition: string;
  steps: string[];
  expectedResult: string;
  tags: string[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface RunResult {
  status: RunResultStatus;
  note: string;
}

export interface TestRun {
  id: string;
  name: string;
  tester: string;
  environment: string;
  status: RunStatus;
  results: Record<string, RunResult>;
  startedAt: number;
  completedAt: number | null;
}

export interface EdgeCase {
  title: string;
  description: string;
  recommendation: string;
}

export interface Gap {
  title: string;
  severity: GapSeverity;
  description: string;
  suggestion: string;
}

export interface AcceptanceCriteria {
  scenario: string;
  given: string;
  when: string;
  then: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  requirements: string;
  userStories: string;
  testCases: TestCase[];
  edgeCases: EdgeCase[];
  gaps: Gap[];
  acceptanceCriteria: AcceptanceCriteria[];
  runs: TestRun[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  suites: TestSuite[];
  activeSuiteId: string | null;
}

export interface GenerateResponse {
  testCases: Omit<TestCase, 'status' | 'tags' | 'order' | 'createdAt' | 'updatedAt'>[];
  edgeCases: EdgeCase[];
  gaps: Gap[];
  acceptanceCriteria: AcceptanceCriteria[];
}

export interface RunStats {
  pass: number;
  fail: number;
  blocked: number;
  skipped: number;
  untested: number;
  total: number;
  passRate: number;
}