import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const emailLower = email.toLowerCase().trim()

    const { data: investor } = await supabase
      .from('actual_investors')
      .select('*')
      .eq('email', emailLower)
      .single()

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    // Check if this is a temp password login
    if (investor.temp_password_hash && investor.temp_password_expires) {
      const tempExpired = new Date(investor.temp_password_expires) < new Date()
      if (!tempExpired) {
        const tempMatch = await bcrypt.compare(password, investor.temp_password_hash)
        if (tempMatch) {
          // Temp password valid — let them in, mark they need to set a real password
          await supabase
            .from('actual_investors')
            .update({ last_login: new Date().toISOString() })
            .eq('id', investor.id)

          return NextResponse.json({
            success: true,
            investor: {
              id: investor.id,
              name: investor.name,
              email: investor.email,
              invested_amount: investor.invested_amount,
              invested_date: investor.invested_date,
              instrument: investor.instrument,
            },
            requirePasswordReset: true,
          })
        }
      }
    }

    // Check regular password
    if (!investor.password_hash) {
      return NextResponse.json({ error: 'No password set. Request a temporary password.' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, investor.password_hash)
    if (!match) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('actual_investors')
      .update({ last_login: new Date().toISOString() })
      .eq('id', investor.id)

    return NextResponse.json({
      success: true,
      investor: {
        id: investor.id,
        name: investor.name,
        email: investor.email,
        invested_amount: investor.invested_amount,
        invested_date: investor.invested_date,
        instrument: investor.instrument,
      },
      requirePasswordReset: false,
    })
  } catch (error) {
    console.error('Gate login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
