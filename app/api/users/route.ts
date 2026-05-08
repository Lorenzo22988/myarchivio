import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

async function getAdminMeta(req: NextRequest) {
  const service = createServiceClient()
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await service.from('profiles')
    .select('*').eq('supabase_user_id', user.id).single()
  return data
}

export async function GET(req: NextRequest) {
  const adminProfile = await getAdminMeta(req)
  if (!adminProfile) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const service = createServiceClient()
  const { data: profiles } = await service.from('profiles')
    .select('id,name,initials,color,color_light,color_dark,role,member_role,created_at')
    .eq('family_id', adminProfile.family_id)
    .order('created_at')

  return NextResponse.json({ profiles })
}

export async function POST(req: NextRequest) {
  const adminProfile = await getAdminMeta(req)
  if (!adminProfile) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  if (adminProfile.role !== 'admin')
    return NextResponse.json({ error: "Solo l'admin può aggiungere membri" }, { status: 403 })

  const body = await req.json()
  const { name, color, colorLight, colorDark, memberRole, pin } = body

  if (!name || !pin)
    return NextResponse.json({ error: 'Nome e PIN obbligatori' }, { status: 400 })

  const pinHash = await bcrypt.hash(String(pin), 10)
  const initials = name.substring(0, 2).toUpperCase()

  const service = createServiceClient()
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

export async function PATCH(req: NextRequest) {
  const adminProfile = await getAdminMeta(req)
  if (!adminProfile) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  if (adminProfile.role !== 'admin')
    return NextResponse.json({ error: "Solo l'admin può modificare membri" }, { status: 403 })

  const body = await req.json()
  const { id, pin, ...rest } = body

  const update: Record<string, unknown> = { ...rest }
  if (pin) update.pin_hash = await bcrypt.hash(String(pin), 10)

  const service = createServiceClient()
  const { error } = await service.from('profiles')
    .update(update).eq('id', id).eq('family_id', adminProfile.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const adminProfile = await getAdminMeta(req)
  if (!adminProfile) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  if (adminProfile.role !== 'admin')
    return NextResponse.json({ error: "Solo l'admin può rimuovere membri" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('id')
  if (!profileId) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('profiles')
    .delete().eq('id', profileId).eq('family_id', adminProfile.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
