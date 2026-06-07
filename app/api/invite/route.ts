import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Email notifications disabled - requires verified domain on Resend
  return NextResponse.json({ success: true })
}