'use client'
import { useState, useEffect, useCallback } from 'react'
import { useActiveProfile } from '@/lib/active-profile-context'
import { Event, CAT_CONFIG } from '@/lib/types'
import EventModal from '@/components/EventModal'

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export default function DashboardPage() {
  const { activeProfile, isAdmin, profiles, authFetch } = useActiveProfile()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [events, setEvents] = useState<Event[]>([])
  const [showModal, setShowModal] = useState(false)
  const [calFilter, setCalFilter] = useState<'all' | 'mine'>('all')

  const loadEvents = useCallback(async () => {
    const res = await authFetch('/api/events')
    const data = await res.json()
    if (data.events) setEvents(data.events)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  const changeMonth = (dir: number) => {
    let m = month + dir
    let y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const filtered = calFilter === 'all' ? events
    : events.filter(e => e.profile_id === activeProfile?.id)

  const getEventsForDate = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return filtered.filter(e => e.date === dateStr)
  }

  const first = new Date(year, month, 1)
  const startDay = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const today = new Date()

  const cells: { day: number; current: boolean }[] = []
  for (let i = 0; i < startDay; i++) cells.push({ day: prevDays - startDay + 1 + i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  const rem = (startDay + daysInMonth) % 7
  if (rem > 0) for (let i = 1; i <= 7 - rem; i++) cells.push({ day: i, current: false })

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-sm font-medium w-40 text-center">{MONTHS[month]} {year}</span>
          <button onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <div className="flex gap-1 ml-2">
            {(['all', 'mine'] as const).map(f => (
              <button key={f} onClick={() => setCalFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${calFilter === f ? 'text-[#085041]' : 'text-gray-400 hover:text-gray-600'}`}
                style={calFilter === f ? { background: '#E1F5EE' } : {}}>
                {f === 'all' ? 'Tutti' : 'Solo miei'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#1D9E75' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuovo evento
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 bg-gray-50">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const isToday = cell.current && today.getFullYear() === year && today.getMonth() === month && today.getDate() === cell.day
              const dayEvs = cell.current ? getEventsForDate(cell.day) : []
              return (
                <div key={i} className={`border-r border-b border-gray-100 p-1.5 min-h-[90px] last:border-r-0 ${!cell.current ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'text-white' : cell.current ? 'text-gray-600' : 'text-gray-300'}`}
                    style={isToday ? { background: '#1D9E75' } : {}}>
                    {cell.day}
                  </div>
                  {dayEvs.slice(0, 2).map(ev => {
                    const p = ev.profile
                    return (
                      <div key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded-md mb-0.5 truncate font-medium"
                        style={{ background: p?.color_light || '#f3f4f6', color: p?.color_dark || '#374151', borderLeft: `2px solid ${p?.color || '#9ca3af'}` }}>
                        {ev.title}
                      </div>
                    )
                  })}
                  {dayEvs.length > 2 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dayEvs.length - 2}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <EventModal
          profiles={isAdmin ? profiles : activeProfile ? [activeProfile] : []}
          defaultProfileId={activeProfile?.id}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadEvents() }}
        />
      )}
    </div>
  )
}
