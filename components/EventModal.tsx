'use client'
import { useState } from 'react'
import { Profile } from '@/lib/types'

interface Props {
  profiles: Profile[]
  defaultProfileId?: string
  onClose: () => void
  onSaved: () => void
}

export default function EventModal({ profiles, defaultProfileId, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('09:00')
  const [category, setCategory] = useState('visita')
  const [note, setNote] = useState('')
  const [profileId, setProfileId] = useState(defaultProfileId || profiles[0]?.id || '')
  const [isFamily, setIsFamily] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !date) return
    setSaving(true)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, time, category, note, profile_id: profileId, is_family: isFamily })
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Nuovo evento</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Titolo</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Es. Visita cardiologica"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ora</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="visita">Visita medica</option>
                <option value="pagamento">Pagamento</option>
                <option value="scadenza">Scadenza</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            {profiles.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Per</label>
                <select value={profileId} onChange={e => setProfileId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              placeholder="Importo, medico, risultati..."/>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFamily} onChange={e => setIsFamily(e.target.checked)} className="rounded"/>
            <span className="text-xs text-gray-600">Visibile a tutta la famiglia</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Annulla
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#1D9E75' }}>
              {saving ? 'Salvo...' : 'Salva evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
