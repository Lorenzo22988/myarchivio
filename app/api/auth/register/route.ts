import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { familyName, adminName, userId } = await req.json()
  if (!familyName || !adminName || !userId)
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })

  const supabase = createServiceClient()

  // Crea la famiglia
  const { data: family, error: fErr } = await supabase
    .from('families')
    .insert({ name: familyName })
    .select()
    .single()

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 })

  // Crea il profilo admin
  const initials = adminName.substring(0, 2).toUpperCase()
  const { error: pErr } = await supabase
    .from('profiles')
    .insert({
      family_id: family.id,
      name: adminName,
      initials,
      color: '#1D9E75',
      color_light: '#E1F5EE',
      color_dark: '#085041',
      role: 'admin',
      member_role: 'adulto',
      supabase_user_id: userId,
    })

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, familyId: family.id })
}
