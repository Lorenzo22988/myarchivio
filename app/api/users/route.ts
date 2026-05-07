import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const service = createServiceClient()
  const { data: myProfile } = await service.from('profiles')
    .select('family_id').eq('supabase_user_id', user.id).single()
  if (!myProfile) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const { data: profiles } = await service.from('profiles')
    .select('id,name,initials,color,color_light,color_dark,role,member_role,created_at')
    .eq('family_id', myProfile.family_id)
    .order('created_at')

  return NextResponse.json({ profiles })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const service = createServiceClient()
  const { data: adminProfile } = await service.from('profiles')
    .select('*').eq('supabase_user_id', user.id).single()

  if (!adminProfile || adminProfile.role !== 'admin')
    return NextResponse.json({ error: 'Solo l\'admin può aggiungere membri' }, { status: 403 })

  const body = await req.json()
  const { name, color, colorLight, colorDark, memberRole, pin } = body

  if (!name || !pin)
    return NextResponse.json({ error: 'Nome e PIN obbligatori' }, { status: 400 })

  const pinHash = await bcrypt.hash(String(pin), 10)
  const initials = name.substring(0, 2).toUpperCase()

  const { data: profile, error } = await service.from('profiles').insert({
    family_id: adminProfile.family_id,
    name, initials,
    color: color || '#378ADD',
    color_light: colorLight || '#E6F1FB',
    color_dark: colorDark || '#0C447C',
    role: 'membro',
    member_role: memberRole || 'adulto',
    pin_hash: pinHash,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const service = createServiceClient()
  const { data: adminProfile } = await service.from('profiles')
    .select('*').eq('supabase_user_id', user.id).single()

  if (!adminProfile || adminProfile.role !== 'admin')
    return NextResponse.json({ error: 'Solo l\'admin può rimuovere membri' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('id')
  if (!profileId) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

  const { error } = await service.from('profiles')
    .delete().eq('id', profileId).eq('family_id', adminProfile.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
