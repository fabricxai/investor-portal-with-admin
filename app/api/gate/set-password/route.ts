import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = createServerClient()
    const emailLower = email.toLowerCase().trim()

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const { error } = await supabase
      .from('actual_investors')
      .update({
        password_hash: passwordHash,
        is_password_set: true,
        temp_password_hash: null,
        temp_password_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', emailLower)

    if (error) {
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}
