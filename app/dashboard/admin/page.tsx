'use client'
import { useEffect, useState } from 'react'
import { useActiveProfile } from '@/lib/active-profile-context'
import { useRouter } from 'next/navigation'
import { Profile, COLORS } from '@/lib/types'

export default function AdminPage() {
  const { isAdmin, profiles, setProfiles } = useActiveProfile()
  const router = useRouter()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [memberRole, setMemberRole] = useState('adulto')
  const [selectedColor, setSelectedColor] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { if (!isAdmin) router.push('/dashboard') }, [isAdmin])

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const c = COLORS[selectedColor]
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin, memberRole, color: c.color, colorLight: c.light, colorDark: c.dark })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Errore'); return }
    setSuccess(`${name} aggiunto con successo!`)
    setName(''); setPin('')
    // Ricarica profili
    const r = await fetch('/api/users')
    const d = await r.json()
    if (d.profiles) setProfiles(d.profiles)
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Eliminare ${name} e tutti i suoi dati?`)) return
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      const r = await fetch('/api/users')
      const d = await r.json()
      if (d.profiles) setProfiles(d.profiles)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white">
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Gestione utenti famiglia</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        {/* Members list */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Membri della famiglia ({profiles.length})</h2>
          <div className="space-y-2">
            {profiles.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: p.color_light, color: p.color_dark }}>{p.initials}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{p.role} · {p.member_role}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.role === 'admin' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>Admin</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        Accesso con PIN
                      </span>
                      <button onClick={() => deleteMember(p.id, p.name)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add member form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Aggiungi un membro</h2>
          <form onSubmit={addMember} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Es. Lucia"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ruolo</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="adulto">Adulto</option>
                  <option value="bambino">Bambino</option>
                  <option value="anziano">Anziano</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">PIN di accesso</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="PIN numerico (es. 1234)" inputMode="numeric" minLength={4} maxLength={8}/>
              <p className="text-xs text-gray-400 mt-1">Il membro userà questo PIN per accedere.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Colore profilo</label>
              <div className="flex gap-2">
                {COLORS.map((c, i) => (
                  <button key={i} type="button" onClick={() => setSelectedColor(i)}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{
                      background: c.color,
                      outline: selectedColor === i ? `3px solid ${c.color}` : 'none',
                      outlineOffset: '2px'
                    }}/>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#1D9E75' }}>
              {loading ? 'Aggiunta...' : 'Aggiungi membro'}
            </button>
          </form>
        </div>

        {/* Login instructions */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-blue-800 mb-1">Come accedono i membri?</h3>
          <p className="text-xs text-blue-700">
            I membri della famiglia vanno su <strong>myarchivio.vercel.app</strong>, cliccano
            &ldquo;Accesso membro&rdquo;, inseriscono il loro nome e PIN. Vedranno i propri dati
            più quelli contrassegnati come &ldquo;Famiglia&rdquo;.
          </p>
        </div>
      </div>
    </div>
  )
}
