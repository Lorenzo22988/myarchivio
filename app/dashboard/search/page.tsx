'use client'
import { useState } from 'react'
import { Event, Document, CAT_CONFIG, DOC_TYPE_LABELS } from '@/lib/types'

function fmt(d: string) { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}` }
function hl(text: string, q: string) {
  if (!q) return text
  return text.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
    '<mark class="bg-[#E1F5EE] text-[#085041] rounded px-0.5">$1</mark>')
}

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true)
    const [evRes, docRes] = await Promise.all([
      fetch('/api/events'),
      fetch(`/api/documents?q=${encodeURIComponent(q)}`),
    ])
    const evData = await evRes.json()
    const docData = await docRes.json()
    const ql = q.toLowerCase()
    const filteredEvents = (evData.events || []).filter((ev: Event) =>
      ev.title.toLowerCase().includes(ql) || ev.note?.toLowerCase().includes(ql)
    )
    setEvents(filteredEvents)
    setDocs(docData.documents || [])
    setLoading(false)
    setSearched(true)
  }

  const total = events.length + docs.length

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white">
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Ricerca</h1>
        <form onSubmit={doSearch} className="flex gap-2 max-w-xl">
          <input value={q} onChange={e => setQ(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-400 focus:ring-1 focus:ring-green-200"
            placeholder="Cerca referti, ricevute, appuntamenti..." />
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#1D9E75' }}>
            {loading ? '...' : 'Cerca'}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {searched && (
          <p className="text-xs text-gray-400 mb-4">
            {total > 0 ? `${total} risultat${total === 1 ? 'o' : 'i'} per "${q}"` : `Nessun risultato per "${q}"`}
          </p>
        )}

        {events.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Appuntamenti ({events.length})</h2>
            <div className="space-y-2">
              {events.map(ev => {
                const p = ev.profile
                const cfg = CAT_CONFIG[ev.category]
                return (
                  <div key={ev.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: p?.color_light || '#f3f4f6' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: p?.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: hl(ev.title, q) }}/>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{fmt(ev.date)}</span>
                        {ev.note && <span className="text-xs text-gray-400" dangerouslySetInnerHTML={{ __html: hl(ev.note, q) }}/>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>{cfg.label}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full text-[9px] font-medium flex items-center justify-center"
                        style={{ background: p?.color_light, color: p?.color_dark }}>{p?.initials}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {docs.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Documenti ({docs.length})</h2>
            <div className="space-y-2">
              {docs.map(doc => {
                const p = doc.profile
                return (
                  <div key={doc.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: p?.color_light || '#f3f4f6' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={p?.color || '#9ca3af'} strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: hl(doc.name, q) }}/>
                      <div className="text-xs text-gray-400">{fmt(doc.created_at.split('T')[0])} • {DOC_TYPE_LABELS[doc.doc_type]}</div>
                    </div>
                    {doc.signed_url && (
                      <a href={doc.signed_url} target="_blank" rel="noopener"
                        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        Apri
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!searched && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-400 text-sm">Cerca tra tutti i tuoi eventi e documenti</p>
          </div>
        )}
      </div>
    </div>
  )
}
