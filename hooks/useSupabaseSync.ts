import { useEffect } from 'react'
import { useStore, useActiveSuite } from '@/store'
import { supabase } from '@/lib/supabase'

export function useSupabaseSync() {
  const suite = useActiveSuite()
  const updateSuite = useStore(s => s.updateSuite)

  // Save suite to Supabase whenever it changes
  useEffect(() => {
    if (!suite) return

    const syncSuite = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('suites').upsert({
        id: suite.id,
        name: suite.name,
        description: suite.description,
        requirements: suite.requirements,
        user_stories: suite.userStories,
        tags: suite.tags,
        owner_id: user.id,
        updated_at: new Date().toISOString(),
      })

      // Sync test cases
      if (suite.testCases.length > 0) {
        await supabase.from('test_cases').upsert(
          suite.testCases.map(tc => ({
            id: tc.id,
            suite_id: suite.id,
            title: tc.title,
            type: tc.type,
            status: tc.status,
            precondition: tc.precondition,
            steps: tc.steps,
            expected_result: tc.expectedResult,
            tags: tc.tags,
            order: tc.order,
            updated_at: new Date().toISOString(),
          }))
        )
      }

      // Sync bug reports
      if (suite.bugs && suite.bugs.length > 0) {
        await supabase.from('bug_reports').upsert(
          suite.bugs.map(bug => ({
            id: bug.id,
            suite_id: suite.id,
            title: bug.title,
            description: bug.description,
            severity: bug.severity,
            priority: bug.priority,
            status: bug.status,
            steps_to_reproduce: bug.stepsToReproduce,
            expected_result: bug.expectedResult,
            actual_result: bug.actualResult,
            environment: bug.environment,
            assignee: bug.assignee,
            related_test_case_id: bug.relatedTestCaseId,
            notes: bug.notes,
            updated_at: new Date().toISOString(),
          }))
        )
      }
    }

    syncSuite()
  }, [suite])
}