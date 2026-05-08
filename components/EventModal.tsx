'use client'
import { useState, useEffect } from 'react'
import { Profile, Event, CAT_CONFIG } from '@/lib/types'
import { useActiveProfile } from '@/lib/active-profile-context'

interface Props {
  profiles: Profile[]
  defaultProfileId?: string
  defaultDate?: string        // pre-imposta la data (click su giorno)
  editEvent?: Event           // se passato, modal in modalità modifica
  onClose: () => void
  onSaved: () => void
}

export default function EventModal({ profiles, defaultProfileId, defaultDate, editEvent, onClose, onSaved }: Props) {
  const { authFetch } = useActiveProfile()
  const isEdit = !!editEvent

  const [title, setTitle]       = useState(editEvent?.title ?? '')
  const [date, setDate]         = useState(editEvent?.date ?? defaultDate ?? new Date().toISOString().split('T')[0])
  const [time, setTime]         = useState(editEvent?.time ?? '09:00')
  const [category, setCategory] = useState(editEvent?.category ?? 'visita')
  const [note, setNote]         = useState(editEvent?.note ?? '')
  const [profileId, setProfileId] = useState(editEvent?.profile_id ?? defaultProfileId ?? profiles[0]?.id ?? '')
  const [isFamily, setIsFamily] = useState(editEvent?.is_family ?? false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  // Chiudi con Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setSaving(true); setError('')
    try {
      const payload = {
        title: title.trim(), date, time: time || null,
        category, note: note.trim() || null,
        profile_id: profileId, is_family: isFamily,
      }
      const res = isEdit
        ? await authFetch(`/api/events?id=${editEvent!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await authFetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Errore'); setSaving(false); return }
      onSaved()
    } catch { setError('Errore di rete'); setSaving(false) }
  }

  async function deleteEvent() {
    if (!editEvent) return
    if (!confirm(`Eliminare "${editEvent.title}"?`)) return
    setDeleting(true)
    await authFetch(`/api/events?id=${editEvent.id}`, { method: 'DELETE' })
    onSaved()
  }

  const catColors: Record<string, string> = {
    visita: '#1D9E75', pagamento: '#3A8C2F', scadenza: '#C07C1A', altro: '#6B5DD3',
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

        {/* Header colorato per categoria */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: catColors[category] + '15', borderBottom: `2px solid ${catColors[category]}25` }}>
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Modifica evento' : 'Nuovo evento'}
          </h2>
          <div className="flex items-center gap-2">
            {isEdit && (
              <button onClick={deleteEvent} disabled={deleting}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Elimina evento">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={save} className="p-6 space-y-4">
          {/* Titolo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Titolo *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required autoFocus
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors"
              placeholder="Es. Visita cardiologica" />
          </div>

          {/* Data + Ora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Data *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ora</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors" />
            </div>
          </div>

          {/* Categoria + Per chi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Categoria</label>
              <div className="flex flex-col gap-1.5">
                {(['visita', 'pagamento', 'scadenza', 'altro'] as const).map(c => (
                  <label key={c} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-xs font-medium ${category === c ? 'border-current' : 'border-gray-100 hover:border-gray-200'}`}
                    style={category === c ? { background: catColors[c] + '18', color: catColors[c], borderColor: catColors[c] + '50' } : { color: '#9ca3af' }}>
                    <input type="radio" name="cat" value={c} checked={category === c}
                      onChange={() => setCategory(c)} className="sr-only" />
                    {CAT_CONFIG[c].label}
                  </label>
                ))}
              </div>
            </div>
            {profiles.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Per</label>
                <div className="flex flex-col gap-1.5">
                  {profiles.map(p => (
                    <label key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-xs font-medium ${profileId === p.id ? 'border-current' : 'border-gray-100 hover:border-gray-200'}`}
                      style={profileId === p.id ? { background: p.color_light, color: p.color_dark, borderColor: p.color + '60' } : { color: '#9ca3af' }}>
                      <input type="radio" name="profile" value={p.id} checked={profileId === p.id}
                        onChange={() => setProfileId(p.id)} className="sr-only" />
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ background: p.color_light, color: p.color_dark }}>{p.initials}</div>
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#1D9E75] transition-colors"
              placeholder="Importo, medico, risultati..." />
          </div>

          {/* Visibilità famiglia */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className={`w-8 h-4 rounded-full transition-colors relative ${isFamily ? 'bg-[#1D9E75]' : 'bg-gray-200'}`}
              onClick={() => setIsFamily(v => !v)}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${isFamily ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-800">Visibile a tutta la famiglia</span>
          </label>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Annulla
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-colors"
              style={{ background: '#1D9E75' }}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {isEdit ? 'Salvataggio...' : 'Salvataggio...'}
                </span>
              ) : isEdit ? 'Salva modifiche' : 'Crea evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
