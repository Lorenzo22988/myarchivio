import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

async function getMeta(userId: string) {
  const service = createServiceClient()
  const { data } = await service.from('profiles')
    .select('family_id,id,role').eq('supabase_user_id', userId).single()
  return data
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const meta = await getMeta(user.id)
  if (!meta) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const service = createServiceClient()
  const { searchParams } = new URL(req.url)
  const docType = searchParams.get('doc_type')
  const profileFilter = searchParams.get('profile_id')
  const q = searchParams.get('q')

  let query = service.from('documents')
    .select('*, profile:profiles(id,name,initials,color,color_light,color_dark)')
    .eq('family_id', meta.family_id)
    .order('created_at', { ascending: false })

  if (meta.role !== 'admin') {
    query = query.or(`profile_id.eq.${meta.id},is_family.eq.true`)
  }
  if (docType) query = query.eq('doc_type', docType)
  if (profileFilter) query = query.eq('profile_id', profileFilter)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Genera URL firmati per ogni documento
  const withUrls = await Promise.all((data || []).map(async (doc) => {
    const { data: urlData } = await service.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600)
    return { ...doc, signed_url: urlData?.signedUrl }
  }))

  return NextResponse.json({ documents: withUrls })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const meta = await getMeta(user.id)
  if (!meta) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const name = formData.get('name') as string
  const docType = formData.get('doc_type') as string
  const eventId = formData.get('event_id') as string | null
  const profileId = (formData.get('profile_id') as string) || meta.id
  const isFamily = formData.get('is_family') === 'true'

  if (!file || !name) return NextResponse.json({ error: 'File e nome obbligatori' }, { status: 400 })

  const service = createServiceClient()
  const ext = file.name.split('.').pop()
  const filePath = `${meta.family_id}/${profileId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadErr } = await service.storage
    .from('documents')
    .upload(filePath, arrayBuffer, { contentType: file.type })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data, error } = await service.from('documents').insert({
    family_id: meta.family_id,
    profile_id: profileId,
    event_id: eventId || null,
    name, doc_type: docType || 'altro',
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    is_family: isFamily,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const meta = await getMeta(user.id)
  if (!meta) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

  const service = createServiceClient()
  const { data: doc } = await service.from('documents')
    .select('file_path').eq('id', id).single()

  if (doc) await service.storage.from('documents').remove([doc.file_path])

  const { error } = await service.from('documents').delete()
    .eq('id', id).eq('family_id', meta.family_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
