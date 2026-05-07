'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Mode = 'choose' | 'admin' | 'register' | 'member_pin'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [pin, setPin] = useState('')
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o password errati.'); setLoading(false); return }
    router.push('/dashboard')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr || !data.user) { setError(authErr?.message || 'Errore registrazione'); setLoading(false); return }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyName, adminName, userId: data.user.id })
    })
    if (!res.ok) { setError('Errore nella creazione della famiglia'); setLoading(false); return }
    router.push('/dashboard')
  }

  async function handleMemberPin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/member-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberName, pin })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'PIN errato'); setLoading(false); return }
    // Salva il profilo membro in sessionStorage e redirect
    sessionStorage.setItem('memberProfile', JSON.stringify(data.profile))
    sessionStorage.setItem('adminToken', data.adminToken)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: '#1D9E75' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4M10 14h4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">MyArchivio</h1>
          <p className="text-sm text-gray-500 mt-1">Documenti e appuntamenti di famiglia</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* CHOOSE */}
          {mode === 'choose' && (
            <div className="space-y-3">
              <button onClick={() => setMode('admin')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#E1F5EE' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#085041" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">Accesso admin</div>
                  <div className="text-xs text-gray-500">Email e password</div>
                </div>
              </button>

              <button onClick={() => setMode('member_pin')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0C447C" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">Accesso membro</div>
                  <div className="text-xs text-gray-500">Nome e PIN</div>
                </div>
              </button>

              <div className="pt-2 text-center">
                <button onClick={() => setMode('register')} className="text-xs text-gray-400 hover:text-gray-600">
                  Prima volta? Crea la tua famiglia →
                </button>
              </div>
            </div>
          )}

          {/* ADMIN LOGIN */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-accent-DEFAULT"
                  placeholder="la@tua-email.it" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="••••••••" />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
                style={{ background: '#1D9E75' }}>
                {loading ? 'Accesso...' : 'Accedi'}
              </button>
              <button type="button" onClick={() => { setMode('choose'); setError('') }}
                className="w-full text-xs text-gray-400 hover:text-gray-600">← Torna indietro</button>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome famiglia</label>
                <input value={familyName} onChange={e => setFamilyName(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Es. Famiglia Rossi" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Il tuo nome (admin)</label>
                <input value={adminName} onChange={e => setAdminName(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Es. Marco" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="la@tua-email.it" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Almeno 6 caratteri" />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: '#1D9E75' }}>
                {loading ? 'Creazione...' : 'Crea famiglia'}
              </button>
              <button type="button" onClick={() => { setMode('choose'); setError('') }}
                className="w-full text-xs text-gray-400 hover:text-gray-600">← Torna indietro</button>
            </form>
          )}

          {/* MEMBER PIN */}
          {mode === 'member_pin' && (
            <form onSubmit={handleMemberPin} className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Inserisci il tuo nome e il PIN assegnato dall'admin.</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Il tuo nome</label>
                <input value={memberName} onChange={e => setMemberName(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Es. Lucia" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">PIN</label>
                <input type="password" value={pin} onChange={e => setPin(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="PIN numerico" inputMode="numeric" maxLength={8} />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: '#378ADD' }}>
                {loading ? 'Verifica...' : 'Accedi con PIN'}
              </button>
              <button type="button" onClick={() => { setMode('choose'); setError('') }}
                className="w-full text-xs text-gray-400 hover:text-gray-600">← Torna indietro</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
