'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Profile } from '@/lib/types'

interface ActiveProfileCtx {
  activeProfile: Profile | null
  setActiveProfile: (p: Profile) => void
  profiles: Profile[]
  setProfiles: (p: Profile[]) => void
  isAdmin: boolean
}

const Ctx = createContext<ActiveProfileCtx>({
  activeProfile: null,
  setActiveProfile: () => {},
  profiles: [],
  setProfiles: () => {},
  isAdmin: false,
})

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    const saved = sessionStorage.getItem('activeProfileId')
    if (saved && profiles.length > 0) {
      const p = profiles.find(p => p.id === saved)
      if (p) setActiveProfileState(p)
    }
  }, [profiles])

  const setActiveProfile = (p: Profile) => {
    setActiveProfileState(p)
    sessionStorage.setItem('activeProfileId', p.id)
  }

  return (
    <Ctx.Provider value={{
      activeProfile,
      setActiveProfile,
      profiles,
      setProfiles,
      isAdmin: activeProfile?.role === 'admin',
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useActiveProfile = () => useContext(Ctx)
