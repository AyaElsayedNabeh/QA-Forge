export type BugSeverity = 'critical' | 'high' | 'medium' | 'low'
export type BugStatus = 'open' | 'in-progress' | 'resolved' | 'closed'
export type BugPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface BugReport {
  id: string
  title: string
  description: string
  severity: BugSeverity
  priority: BugPriority
  status: BugStatus
  stepsToReproduce: string[]
  expectedResult: string
  actualResult: string
  environment: string
  assignee: string
  relatedTestCaseId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}