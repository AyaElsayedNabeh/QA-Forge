import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured.' }, { status: 500 });
    }

    const systemPrompt = `You are a QA Bot Manager assistant. You analyze test suites and provide insights.

Current Test Suite Data:
${JSON.stringify(context, null, 2)}

Your job:
- Summarize the test suite status
- Identify risks and gaps
- Answer questions about the test cases
- Suggest improvements
- Be concise and actionable

Always respond in the same language the user writes in.`;

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
        temperature: 0.5,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No response';
    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Bot error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}