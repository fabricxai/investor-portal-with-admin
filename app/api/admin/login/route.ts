import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 })
  }

  if (email !== adminEmail) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Compare password — support both hashed and plaintext for dev
  let valid = false
  if (adminPassword.startsWith('$2')) {
    valid = await bcrypt.compare(password, adminPassword)
  } else {
    valid = password === adminPassword
  }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Set admin cookie
  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
  const cookieStore = await cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return NextResponse.json({ success: true })
}
