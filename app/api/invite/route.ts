import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, projectName, inviterEmail } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'QA Forge <onboarding@resend.dev>',
      to: email,
      subject: `You've been invited to join ${projectName} on QA Forge`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🧪 QA Forge</h1>
          </div>
          
          <h2 style="color: #1e293b; font-size: 20px;">You've been invited!</h2>
          
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            <strong>${inviterEmail}</strong> has added you as a tester to the project 
            <strong>${projectName}</strong> on QA Forge.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #475569; font-size: 14px;">
              <strong>Steps to get started:</strong>
            </p>
            <ol style="color: #475569; font-size: 14px; line-height: 2;">
              <li>Click the button below to open QA Forge</li>
              <li>Sign up with this email address</li>
              <li>You'll find the project waiting for you</li>
            </ol>
          </div>

          <a href="https://qa-forge-iurk.vercel.app" 
             style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Open QA Forge →
          </a>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            This invitation was sent by ${inviterEmail} via QA Forge.
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}