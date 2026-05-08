'use client'
import { useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ActiveProfileProvider, useActiveProfile } from '@/lib/active-profile-context'
import { Profile } from '@/lib/types'

const NAV = [
  { href: '/dashboard',           label: 'Calendario',   d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/events',    label: 'Appuntamenti', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/dashboard/archive',   label: 'Archivio',     d: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
  { href: '/dashboard/compare',   label: 'Confronta',    d: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { href: '/dashboard/search',    label: 'Ricerca',      d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
]

function SideIcon({ href, label, d, active }: { href: string; label: string; d: string; active: boolean }) {
  return (
    <Link href={href} className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-[#E1F5EE]' : 'hover:bg-gray-100'}`}>
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={active ? '#085041' : '#9ca3af'} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
      <span className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">{label}</span>
    </Link>
  )
}

function Inner({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { activeProfile, setActiveProfile, profiles, setProfiles, isAdmin } = useActiveProfile()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Admin: carica tutti i profili della famiglia
        const res = await fetch('/api/users')
        const data = await res.json()
        if (data.profiles && data.profiles.length > 0) {
          setProfiles(data.profiles)
          // Imposta sempre il profilo admin come attivo al login
          const adminP = data.profiles.find((p: Profile) => p.role === 'admin')
          if (adminP) setActiveProfile(adminP)
        }
        setLoading(false)
        return
      }

      // Membro con PIN: usa il profilo salvato in sessionStorage
      const memberRaw = sessionStorage.getItem('memberProfile')
      if (memberRaw) {
        const profile = JSON.parse(memberRaw) as Profile
        setProfiles([profile])
        setActiveProfile(profile)
        setLoading(false)
        return
      }

      router.push('/login')
    }
    init()
  }, []) // eslint-disable-line

  async function logout() {
    sessionStorage.clear()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-[#1D9E75] animate-spin" />
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 border-r border-gray-100 bg-white gap-1 shrink-0">

        {/* Logo */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 shrink-0" style={{ background: '#1D9E75' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4M10 14h4"/>
          </svg>
        </div>

        {/* Nav links */}
        {NAV.map(n => (
          <SideIcon key={n.href} href={n.href} label={n.label} d={n.d} active={pathname === n.href} />
        ))}

        <div className="flex-1" />

        {/* Bottone Utenti — visibile SOLO all'admin */}
        {isAdmin && (
          <Link href="/dashboard/admin"
            className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-1 ${pathname === '/dashboard/admin' ? 'bg-[#E1F5EE]' : 'hover:bg-gray-100'}`}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
              stroke={pathname === '/dashboard/admin' ? '#085041' : '#9ca3af'} strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Gestione utenti
            </span>
            {/* Badge verde per far notare il bottone */}
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1D9E75]" />
          </Link>
        )}

        {/* Avatar / menu utente */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all"
            style={{
              background: activeProfile?.color_light || '#f3f4f6',
              color: activeProfile?.color_dark || '#374151',
              borderColor: activeProfile?.color || '#e5e7eb',
            }}>
            {activeProfile?.initials || '?'}
          </button>

          {showUserMenu && (
            <div className="absolute bottom-0 left-12 bg-white border border-gray-100 rounded-xl shadow-xl p-2 z-50 min-w-[180px]">
              {/* Profilo attivo */}
              <div className="flex items-center gap-2 px-2 py-2 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: activeProfile?.color_light, color: activeProfile?.color_dark }}>
                  {activeProfile?.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{activeProfile?.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{activeProfile?.role}</div>
                </div>
              </div>

              {/* Switcher profili (solo admin) */}
              {isAdmin && profiles.filter(p => p.id !== activeProfile?.id).length > 0 && (
                <>
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-2 mb-1">Passa a</div>
                  {profiles.filter(p => p.id !== activeProfile?.id).map(p => (
                    <button key={p.id}
                      onClick={() => { setActiveProfile(p); setShowUserMenu(false) }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                        style={{ background: p.color_light, color: p.color_dark }}>{p.initials}</div>
                      {p.name}
                    </button>
                  ))}
                </>
              )}

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button onClick={logout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Esci
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ActiveProfileProvider>
      <Inner>{children}</Inner>
    </ActiveProfileProvider>
  )
}
