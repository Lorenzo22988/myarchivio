import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { memberName, pin } = await req.json()
  if (!memberName || !pin)
    return NextResponse.json({ error: 'Nome e PIN obbligatori' }, { status: 400 })

  const supabase = createServiceClient()

  // Cerca il profilo per nome (case-insensitive), solo membri non-admin
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('name', memberName.trim())
    .eq('role', 'membro')

  if (error || !profiles?.length)
    return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })

  // Verifica PIN
  const profile = profiles.find(p => p.pin_hash && bcrypt.compareSync(String(pin), p.pin_hash))
  if (!profile)
    return NextResponse.json({ error: 'PIN errato' }, { status: 401 })

  // Restituisce il profilo (senza pin_hash per sicurezza)
  const { pin_hash: _, ...safeProfile } = profile
  return NextResponse.json({ profile: safeProfile })
}
