'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { Profile } from '@/lib/types'

interface ActiveProfileCtx {
  activeProfile: Profile | null
  setActiveProfile: (p: Profile) => void
  profiles: Profile[]
  setProfiles: (p: Profile[]) => void
  isAdmin: boolean
  // Helper per fare fetch autenticata (funziona sia per admin che per membri PIN)
  authFetch: (url: string, init?: RequestInit) => Promise<Response>
}

const Ctx = createContext<ActiveProfileCtx>({
  activeProfile: null,
  setActiveProfile: () => {},
  profiles: [],
  setProfiles: () => {},
  isAdmin: false,
  authFetch: (url, init) => fetch(url, init),
})

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])

  const setActiveProfile = (p: Profile) => {
    setActiveProfileState(p)
    if (p.role === 'membro') {
      sessionStorage.setItem('memberProfile', JSON.stringify(p))
    }
  }

  // Aggiunge automaticamente X-Profile-Id per i membri senza sessione Supabase
  const authFetch = (url: string, init: RequestInit = {}): Promise<Response> => {
    if (activeProfile?.role === 'membro') {
      const headers = new Headers(init.headers || {})
      headers.set('X-Profile-Id', activeProfile.id)
      return fetch(url, { ...init, headers })
    }
    return fetch(url, init)
  }

  return (
    <Ctx.Provider value={{
      activeProfile,
      setActiveProfile,
      profiles,
      setProfiles,
      isAdmin: activeProfile?.role === 'admin',
      authFetch,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useActiveProfile = () => useContext(Ctx)
