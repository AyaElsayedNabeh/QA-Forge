import { NextRequest, NextResponse } from 'next/server';
import { buildContext, retrieveRelevantChunks } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const { message, suite } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured.' },
        { status: 500 }
      );
    }

    // Build full context from suite data
    const fullContext = buildContext(suite);

    // Retrieve only relevant chunks based on the query
    const relevantContext = retrieveRelevantChunks(fullContext, message);

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
        messages: [
          {
            role: 'system',
            content: `You are a QA Bot Manager with access to the actual test suite data below.
Use this data to answer questions accurately and specifically.
Always refer to real test case IDs, titles, and data from the context.
Be concise and actionable.

=== RETRIEVED DATA ===
${relevantContext}
=== END OF DATA ===`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No response';
    return NextResponse.json({ reply });

  } catch (err) {
    console.error('RAG error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}