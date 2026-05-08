'use client'
import { useEffect, useState, useCallback } from 'react'
import { Event } from '@/lib/types'
import { useActiveProfile } from '@/lib/active-profile-context'

function fmt(d: string) { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}` }

export default function ComparePage() {
  const { authFetch } = useActiveProfile()
  const [events, setEvents] = useState<Event[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')

  const load = useCallback(async () => {
    const res = await authFetch('/api/events')
    const data = await res.json()
    if (data.events) setEvents(data.events)
  }, [])

  useEffect(() => { load() }, [load])

  // Raggruppa per titolo (esami/pagamenti ripetuti)
  const groups: Record<string, Event[]> = {}
  events.forEach(ev => {
    const key = ev.title.toLowerCase().trim()
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  })
  const repeated = Object.entries(groups)
    .filter(([, evs]) => evs.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)

  const filtered = repeated.filter(([key]) =>
    !search || key.includes(search.toLowerCase())
  )

  const selectedGroup = selected ? groups[selected] : null

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white">
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Confronta nel tempo</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-64 border-r border-gray-100 flex flex-col bg-white">
          <div className="p-3 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              placeholder="Filtra..." />
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-4 text-xs text-gray-400">
                {repeated.length === 0
                  ? 'Nessun evento ripetuto ancora. Aggiungi almeno 2 eventi con lo stesso titolo.'
                  : 'Nessun risultato.'}
              </div>
            )}
            {filtered.map(([key, evs]) => {
              const latest = evs.sort((a, b) => b.date.localeCompare(a.date))[0]
              const p = latest.profile
              return (
                <button key={key} onClick={() => setSelected(key)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${selected === key ? 'bg-[#E1F5EE]' : 'hover:bg-gray-50'}`}>
                  <div className="text-xs font-medium text-gray-900 truncate capitalize">{key}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-4 h-4 rounded-full text-[8px] font-medium flex items-center justify-center"
                      style={{ background: p?.color_light, color: p?.color_dark }}>{p?.initials}</div>
                    <span className="text-[10px] text-gray-400">{evs.length} occorrenze</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedGroup ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-400 text-sm">Seleziona un elemento per vedere la cronologia</p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-gray-900 mb-1 capitalize">{selected}</h2>
              <p className="text-xs text-gray-400 mb-6">{selectedGroup.length} occorrenze nel tempo</p>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-0 w-px bg-gray-100"/>
                <div className="space-y-4">
                  {selectedGroup.sort((a, b) => b.date.localeCompare(a.date)).map((ev, i) => {
                    const p = ev.profile
                    const isLatest = i === 0
                    return (
                      <div key={ev.id} className="flex gap-4">
                        <div className="relative z-10 mt-3 flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white`}
                            style={{ background: isLatest ? p?.color || '#1D9E75' : p?.color_light || '#f3f4f6',
                              color: isLatest ? '#fff' : p?.color_dark || '#374151' }}>
                            {p?.initials}
                          </div>
                        </div>
                        <div className={`flex-1 bg-white border rounded-xl px-4 py-3 ${isLatest ? 'border-[#1D9E75]' : 'border-gray-100'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500">{fmt(ev.date)}{ev.time ? ` · ${ev.time}` : ''}</span>
                            {isLatest && <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>Più recente</span>}
                          </div>
                          {ev.note && <div className="text-sm text-gray-800 font-medium">{ev.note}</div>}
                          <div className="text-xs text-gray-400 mt-1">{p?.name}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
