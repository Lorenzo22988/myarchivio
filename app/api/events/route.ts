import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

async function getFamilyId(userId: string) {
  const service = createServiceClient()
  const { data } = await service.from('profiles')
    .select('family_id,id,role').eq('supabase_user_id', userId).single()
  return data
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const meta = await getFamilyId(user.id)
  if (!meta) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const service = createServiceClient()
  const { searchParams } = new URL(req.url)
  const profileFilter = searchParams.get('profile_id')

  let query = service.from('events')
    .select('*, profile:profiles(id,name,initials,color,color_light,color_dark)')
    .eq('family_id', meta.family_id)
    .order('date', { ascending: false })

  // Se non admin, filtra: propri + family
  if (meta.role !== 'admin') {
    query = query.or(`profile_id.eq.${meta.id},is_family.eq.true`)
  }

  if (profileFilter) {
    query = query.eq('profile_id', profileFilter)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events: data })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const meta = await getFamilyId(user.id)
  if (!meta) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const body = await req.json()
  const service = createServiceClient()

  const { data, error } = await service.from('events').insert({
    family_id: meta.family_id,
    profile_id: body.profile_id || meta.id,
    title: body.title,
    date: body.date,
    time: body.time || null,
    category: body.category || 'altro',
    note: body.note || null,
    is_family: body.is_family || false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const meta = await getFamilyId(user.id)
  if (!meta) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('events').delete()
    .eq('id', id).eq('family_id', meta.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
