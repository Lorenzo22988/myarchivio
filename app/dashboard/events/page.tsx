'use client'
import { useEffect, useState, useCallback } from 'react'
import { useActiveProfile } from '@/lib/active-profile-context'
import { Event, CAT_CONFIG } from '@/lib/types'
import EventModal from '@/components/EventModal'

function fmt(d: string) { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}` }

export default function EventsPage() {
  const { activeProfile, isAdmin, profiles, authFetch } = useActiveProfile()
  const [events, setEvents] = useState<Event[]>([])
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const load = useCallback(async () => {
    const res = await authFetch('/api/events')
    const data = await res.json()
    if (data.events) setEvents(data.events)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteEvent(id: string) {
    if (!confirm('Eliminare questo evento?')) return
    await authFetch(`/api/events?id=${id}`, { method: 'DELETE' })
    load()
  }

  const cats = ['all', 'visita', 'pagamento', 'scadenza', 'altro']
  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter)

  const stats = {
    total: events.length,
    visite: events.filter(e => e.category === 'visita').length,
    pagamenti: events.filter(e => e.category === 'pagamento').length,
    docs: events.filter(e => e.is_family).length,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Appuntamenti</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#1D9E75' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuovo evento
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Totale', value: stats.total },
            { label: 'Visite', value: stats.visite },
            { label: 'Pagamenti', value: stats.pagamenti },
            { label: 'Condivisi', value: stats.docs },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4">
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === c ? 'text-[#085041]' : 'text-gray-500 hover:text-gray-700'}`}
              style={filter === c ? { background: '#E1F5EE' } : { background: '#f3f4f6' }}>
              {c === 'all' ? 'Tutti' : CAT_CONFIG[c as keyof typeof CAT_CONFIG]?.label || c}
            </button>
          ))}
        </div>

        {/* Events */}
        <div className="space-y-2">
          {filtered.map(ev => {
            const p = ev.profile
            const cfg = CAT_CONFIG[ev.category]
            return (
              <div key={ev.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-200 transition-colors group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: p?.color_light || '#f3f4f6' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={p?.color || '#9ca3af'} strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{ev.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{fmt(ev.date)}</span>
                    {ev.time && <span className="text-xs text-gray-400">{ev.time}</span>}
                    {ev.note && <span className="text-xs text-gray-400 truncate">{ev.note}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>{cfg.label}</span>
                  {ev.is_family && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Famiglia</span>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium"
                      style={{ background: p?.color_light, color: p?.color_dark }}>{p?.initials}</div>
                    <span className="text-xs text-gray-400">{p?.name}</span>
                  </div>
                  {(isAdmin || ev.profile_id === activeProfile?.id) && (
                    <button onClick={() => deleteEvent(ev.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Nessun evento trovato.</div>
          )}
        </div>
      </div>

      {showModal && (
        <EventModal
          profiles={isAdmin ? profiles : activeProfile ? [activeProfile] : []}
          defaultProfileId={activeProfile?.id}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
