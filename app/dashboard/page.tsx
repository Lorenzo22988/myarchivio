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
  const [calFilter, setCalFilter] = useState<'all' | 'mine'>('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string | undefined>()
  const [editEvent, setEditEvent] = useState<Event | undefined>()

  // Popup giorno (quando ci sono più eventi)
  const [dayPopup, setDayPopup] = useState<{ date: string; events: Event[] } | null>(null)

  const loadEvents = useCallback(async () => {
    const res = await authFetch('/api/events')
    const data = await res.json()
    if (data.events) setEvents(data.events)
  }, [authFetch])

  useEffect(() => { loadEvents() }, [loadEvents])

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const filtered = calFilter === 'all' ? events : events.filter(e => e.profile_id === activeProfile?.id)

  const dateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const getEventsForDate = (d: number) => filtered.filter(e => e.date === dateStr(d))

  // Click sul giorno vuoto → nuovo evento con data
  function handleDayClick(d: number, e: React.MouseEvent) {
    // evita trigger se si clicca su un evento
    if ((e.target as HTMLElement).closest('[data-event]')) return
    setEditEvent(undefined)
    setModalDate(dateStr(d))
    setModalOpen(true)
  }

  // Click su un evento → modifica
  function handleEventClick(ev: Event, e: React.MouseEvent) {
    e.stopPropagation()
    setEditEvent(ev)
    setModalDate(undefined)
    setDayPopup(null)
    setModalOpen(true)
  }

  // Click su +N → popup lista eventi del giorno
  function handleMoreClick(d: number, evs: Event[], e: React.MouseEvent) {
    e.stopPropagation()
    setDayPopup({ date: dateStr(d), events: evs })
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

  const catColors: Record<string, string> = {
    visita: '#1D9E75', pagamento: '#3A8C2F', scadenza: '#C07C1A', altro: '#6B5DD3',
  }

  return (
    <div className="flex flex-col h-full" onClick={() => setDayPopup(null)}>
      {/* Topbar */}
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
            className="text-sm font-medium w-44 text-center hover:text-[#1D9E75] transition-colors">
            {MONTHS[month]} {year}
          </button>
          <button onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <div className="flex gap-1 ml-1">
            {(['all', 'mine'] as const).map(f => (
              <button key={f} onClick={() => setCalFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${calFilter === f ? 'text-[#085041]' : 'text-gray-400 hover:text-gray-600'}`}
                style={calFilter === f ? { background: '#E1F5EE' } : {}}>
                {f === 'all' ? 'Tutti' : 'Solo miei'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setEditEvent(undefined); setModalDate(undefined); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: '#1D9E75' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuovo evento
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden h-full flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
            {DAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-medium text-gray-400 bg-gray-50">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 flex-1">
            {cells.map((cell, i) => {
              const isToday = cell.current && today.getFullYear() === year && today.getMonth() === month && today.getDate() === cell.day
              const dayEvs = cell.current ? getEventsForDate(cell.day) : []
              const visible = dayEvs.slice(0, 3)
              const extra = dayEvs.length - 3

              return (
                <div key={i}
                  onClick={cell.current ? (e) => handleDayClick(cell.day, e) : undefined}
                  className={`border-r border-b border-gray-100 p-1.5 min-h-[90px] relative
                    ${i % 7 === 6 ? 'border-r-0' : ''}
                    ${!cell.current ? 'bg-gray-50/40' : 'cursor-pointer hover:bg-[#E1F5EE]/20'}
                    transition-colors`}>

                  {/* Numero giorno */}
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full select-none
                    ${isToday ? 'text-white font-semibold' : cell.current ? 'text-gray-600' : 'text-gray-300'}`}
                    style={isToday ? { background: '#1D9E75' } : {}}>
                    {cell.day}
                  </div>

                  {/* Eventi */}
                  {visible.map(ev => {
                    const p = ev.profile
                    return (
                      <div key={ev.id} data-event="1"
                        onClick={e => handleEventClick(ev, e)}
                        className="text-[10px] px-1.5 py-[3px] rounded-md mb-0.5 truncate font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          background: p?.color_light || '#f3f4f6',
                          color: p?.color_dark || '#374151',
                          borderLeft: `2px solid ${catColors[ev.category] || p?.color || '#9ca3af'}`,
                        }}
                        title={`${ev.title}${ev.time ? ' · ' + ev.time : ''}`}>
                        {ev.time && <span className="opacity-60 mr-0.5">{ev.time.slice(0,5)}</span>}
                        {ev.title}
                      </div>
                    )
                  })}

                  {extra > 0 && (
                    <button data-event="1"
                      onClick={e => handleMoreClick(cell.day, dayEvs, e)}
                      className="text-[10px] text-[#1D9E75] font-medium px-1 hover:underline">
                      +{extra} altri
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Popup lista eventi del giorno */}
      {dayPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={() => setDayPopup(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">
                {new Date(dayPopup.date + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
              </span>
              <button onClick={() => setDayPopup(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-1.5">
              {dayPopup.events.map(ev => {
                const p = ev.profile
                return (
                  <div key={ev.id}
                    onClick={e => handleEventClick(ev, e)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: catColors[ev.category] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{ev.title}</div>
                      {ev.time && <div className="text-xs text-gray-400">{ev.time.slice(0,5)}</div>}
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                      style={{ background: p?.color_light, color: p?.color_dark }}>{p?.initials}</div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => { setDayPopup(null); setEditEvent(undefined); setModalDate(dayPopup.date); setModalOpen(true) }}
              className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-white"
              style={{ background: '#1D9E75' }}>
              + Aggiungi evento
            </button>
          </div>
        </div>
      )}

      {/* Modal nuovo/modifica evento */}
      {modalOpen && (
        <EventModal
          profiles={isAdmin ? profiles : activeProfile ? [activeProfile] : []}
          defaultProfileId={activeProfile?.id}
          defaultDate={modalDate}
          editEvent={editEvent}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadEvents() }}
        />
      )}
    </div>
  )
}
