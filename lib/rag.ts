import type { TestSuite } from '@/types';

// Convert suite data into searchable text chunks
export function buildContext(suite: TestSuite): string {
  const chunks: string[] = [];

  // Suite overview
  chunks.push(`Test Suite: ${suite.name}`);
  chunks.push(`Description: ${suite.description || 'No description'}`);
  chunks.push(`Total Test Cases: ${suite.testCases.length}`);
  chunks.push(`Total Runs: ${suite.runs.length}`);

  // Test cases
  if (suite.testCases.length > 0) {
    chunks.push('\n=== TEST CASES ===');
    suite.testCases.forEach(tc => {
      chunks.push(`
ID: ${tc.id}
Title: ${tc.title}
Type: ${tc.type}
Status: ${tc.status}
Precondition: ${tc.precondition || 'None'}
Steps: ${tc.steps.join(' -> ')}
Expected Result: ${tc.expectedResult}
Tags: ${tc.tags?.join(', ') || 'None'}
      `.trim());
    });
  }

  // Gaps
  if (suite.gaps.length > 0) {
    chunks.push('\n=== GAPS ===');
    suite.gaps.forEach(gap => {
      chunks.push(`
Gap: ${gap.title}
Severity: ${gap.severity}
Description: ${gap.description}
Suggestion: ${gap.suggestion || 'None'}
      `.trim());
    });
  }

  // Edge cases
  if (suite.edgeCases.length > 0) {
    chunks.push('\n=== EDGE CASES ===');
    suite.edgeCases.forEach(ec => {
      chunks.push(`
Edge Case: ${ec.title}
Description: ${ec.description}
Recommendation: ${ec.recommendation || 'None'}
      `.trim());
    });
  }

  // Acceptance criteria
  if (suite.acceptanceCriteria.length > 0) {
    chunks.push('\n=== ACCEPTANCE CRITERIA ===');
    suite.acceptanceCriteria.forEach(ac => {
      chunks.push(`
Scenario: ${ac.scenario}
Given: ${ac.given}
When: ${ac.when}
Then: ${ac.then}
      `.trim());
    });
  }

  // Run history
  if (suite.runs.length > 0) {
    chunks.push('\n=== TEST RUNS ===');
    suite.runs.forEach(run => {
      const results = Object.values(run.results);
      const passed = results.filter(r => r.status === 'pass').length;
      const failed = results.filter(r => r.status === 'fail').length;
      chunks.push(`
Run: ${run.name}
Tester: ${run.tester}
Environment: ${run.environment}
Status: ${run.status}
Passed: ${passed} | Failed: ${failed} | Total: ${results.length}
      `.trim());
    });
  }

  return chunks.join('\n');
}

// Simple keyword search to find relevant chunks
export function retrieveRelevantChunks(
  context: string,
  query: string,
  maxChars = 3000
): string {
  const lines = context.split('\n');
  const queryWords = query.toLowerCase().split(' ');

  // Score each line by relevance
  const scored = lines.map(line => ({
    line,
    score: queryWords.filter(w => line.toLowerCase().includes(w)).length,
  }));

  // Sort by score, keep top relevant lines
  const relevant = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.line)
    .join('\n');

  // If nothing relevant found, return full context (truncated)
  const result = relevant || context;
  return result.slice(0, maxChars);
}