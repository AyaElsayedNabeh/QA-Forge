import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { requirements, userStories } = await request.json();

    if (!requirements?.trim() && !userStories?.trim()) {
      return NextResponse.json(
        { error: 'Requirements or user stories are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured.' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'QA Test Design Studio',
      },
      body: JSON.stringify({
        model:  'openrouter/free',
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: 'You are a senior QA engineer. Return ONLY valid JSON — no markdown, no backticks, no explanation before or after the JSON.',
          },
          {
            role: 'user',
            content: `Analyze these requirements and user stories, generate comprehensive QA test artifacts.

Requirements:
${requirements || '(none)'}

User Stories:
${userStories || '(none)'}

Return ONLY this JSON — no other text:
{
  "testCases": [
    {
      "id": "TC-001",
      "title": "descriptive title",
      "type": "positive",
      "precondition": "system state before test",
      "steps": ["step 1", "step 2", "step 3"],
      "expectedResult": "specific measurable outcome"
    }
  ],
  "edgeCases": [
    {
      "title": "edge case title",
      "description": "why this matters",
      "recommendation": "how to handle it"
    }
  ],
  "gaps": [
    {
      "title": "gap title",
      "severity": "high",
      "description": "what is missing",
      "suggestion": "concrete recommendation"
    }
  ],
  "acceptanceCriteria": [
    {
      "scenario": "scenario name",
      "given": "context",
      "when": "action",
      "then": "expected outcome"
    }
  ]
}

Generate 8-12 test cases (mix of type "positive", "negative", "boundary"), 3-5 edge cases, 2-4 gaps (severity "high"/"medium"/"low"), 4-8 acceptance criteria.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenRouter API error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
const jsonMatch = raw.match(/\{[\s\S]*\}/);
const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response. Raw: ' + cleaned.slice(0, 200) }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}