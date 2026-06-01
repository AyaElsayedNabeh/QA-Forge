import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'suites.json');

async function readData() {
  try {
    const raw = await readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { suites: [] };
  }
}

async function writeData(data: unknown) {
  const { mkdir } = await import('fs/promises');
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readData();
    data.suites = body.suites ?? data.suites;
    await writeData(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Suites save error:', err);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}