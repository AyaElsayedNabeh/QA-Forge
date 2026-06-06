import { NextRequest, NextResponse } from 'next/server';
import { AGENTS, AgentKey } from '@/lib/agents';

async function runAgent(
  agentKey: AgentKey,
  input: string,
  apiKey: string,
  previousOutputs?: string
): Promise<string> {
  const agent = AGENTS[agentKey];

  const messages = [
    { role: 'system', content: agent.prompt },
    {
      role: 'user',
      content: previousOutputs
        ? `Previous agents findings:\n${previousOutputs}\n\nNow analyze:\n${input}`
        : `Analyze the following:\n${input}`,
    },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'QA Test Design Studio',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      temperature: 0.4,
      max_tokens: 1024,
      messages,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? 'No response';
}

export async function POST(request: NextRequest) {
  try {
    const { requirements, userStories } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured.' },
        { status: 500 }
      );
    }

    const input = `
Requirements:
${requirements || '(none)'}

User Stories:
${userStories || '(none)'}
    `.trim();

    // Run agents sequentially
    const analyzerOutput = await runAgent('analyzer', input, apiKey);
    const testDesignerOutput = await runAgent('testDesigner', input, apiKey, analyzerOutput);
    const riskOutput = await runAgent('riskAgent', input, apiKey, analyzerOutput);
    const reporterOutput = await runAgent(
      'reporter',
      input,
      apiKey,
      `Analyzer:\n${analyzerOutput}\n\nTest Designer:\n${testDesignerOutput}\n\nRisk Agent:\n${riskOutput}`
    );

    return NextResponse.json({
      agents: {
        analyzer: { name: AGENTS.analyzer.name, output: analyzerOutput },
        testDesigner: { name: AGENTS.testDesigner.name, output: testDesignerOutput },
        riskAgent: { name: AGENTS.riskAgent.name, output: riskOutput },
        reporter: { name: AGENTS.reporter.name, output: reporterOutput },
      },
    });

  } catch (err) {
    console.error('Multi-agent error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}