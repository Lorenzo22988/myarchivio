'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useActiveProfile } from '@/lib/active-profile-context'
import { Document, DOC_TYPE_LABELS } from '@/lib/types'

function fmt(d: string) { const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}` }
function fmtSize(b: number) { return b > 1024*1024 ? `${(b/1024/1024).toFixed(1)} MB` : `${Math.round(b/1024)} KB` }

const DOC_ICONS: Record<string, string> = {
  referto: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  ricevuta: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  prescrizione: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  altro: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
}

export default function ArchivePage() {
  const { activeProfile, isAdmin, profiles, authFetch } = useActiveProfile()
  const [docs, setDocs] = useState<Document[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [profileFilter, setProfileFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('altro')
  const [uploadProfile, setUploadProfile] = useState(activeProfile?.id || '')
  const [uploadFamily, setUploadFamily] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    let url = '/api/documents?'
    if (typeFilter !== 'all') url += `doc_type=${typeFilter}&`
    if (profileFilter !== 'all') url += `profile_id=${profileFilter}&`
    const res = await authFetch(url)
    const data = await res.json()
    if (data.documents) setDocs(data.documents)
  }, [typeFilter, profileFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (activeProfile) setUploadProfile(activeProfile.id) }, [activeProfile])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || !uploadName) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('name', uploadName)
    fd.append('doc_type', uploadType)
    fd.append('profile_id', uploadProfile || activeProfile?.id || '')
    fd.append('is_family', String(uploadFamily))
    const res = await authFetch('/api/documents', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) { setShowUpload(false); setSelectedFile(null); setUploadName(''); load() }
  }

  async function deleteDoc(id: string) {
    if (!confirm('Eliminare questo documento?')) return
    await authFetch(`/api/documents?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Archivio documenti</h1>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#1D9E75' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Carica documento
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {['all','referto','ricevuta','prescrizione','altro'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${typeFilter === t ? 'text-[#085041]' : 'text-gray-500 hover:text-gray-700'}`}
              style={typeFilter === t ? { background: '#E1F5EE' } : { background: '#f3f4f6' }}>
              {t === 'all' ? 'Tutti' : DOC_TYPE_LABELS[t as keyof typeof DOC_TYPE_LABELS]}
            </button>
          ))}
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => setProfileFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${profileFilter === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
              style={profileFilter === 'all' ? { background: '#374151' } : { background: '#f3f4f6' }}>
              Tutti i membri
            </button>
            {profiles.map(p => (
              <button key={p.id} onClick={() => setProfileFilter(p.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={profileFilter === p.id ? { background: p.color_light, color: p.color_dark } : { background: '#f3f4f6', color: '#6b7280' }}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Documents grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {docs.map(doc => {
            const p = doc.profile
            return (
              <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors group flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: p?.color_light || '#f3f4f6' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={p?.color || '#9ca3af'} strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d={DOC_ICONS[doc.doc_type] || DOC_ICONS.altro}/>
                    </svg>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.signed_url && (
                      <a href={doc.signed_url} target="_blank" rel="noopener"
                        className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                      </a>
                    )}
                    {(isAdmin || doc.profile_id === activeProfile?.id) && (
                      <button onClick={() => deleteDoc(doc.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-800 leading-tight mb-1 line-clamp-2">{doc.name}</div>
                <div className="text-[10px] text-gray-400">{fmt(doc.created_at.split('T')[0])}</div>
                {doc.file_size && <div className="text-[10px] text-gray-400">{fmtSize(doc.file_size)}</div>}
                <div className="flex items-center gap-1 mt-auto pt-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium"
                    style={{ background: p?.color_light, color: p?.color_dark }}>{p?.initials}</div>
                  <span className="text-[10px] text-gray-400">{p?.name}</span>
                  {doc.is_family && <span className="text-[10px] text-blue-500 ml-auto">famiglia</span>}
                </div>
              </div>
            )
          })}
          {docs.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 text-sm">Nessun documento caricato.</div>
          )}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-base font-semibold mb-4">Carica documento</h2>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">File</label>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-300 transition-colors">
                  {selectedFile ? (
                    <div className="text-sm text-gray-700">{selectedFile.name}</div>
                  ) : (
                    <div className="text-sm text-gray-400">Clicca per selezionare un file (PDF, immagine...)</div>
                  )}
                  <input ref={fileRef} type="file" className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={e => { if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); if (!uploadName) setUploadName(e.target.files[0].name.replace(/\.[^/.]+$/, '')) }}}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome documento</label>
                <input value={uploadName} onChange={e => setUploadName(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Es. Referto visita cardiologica"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
                  <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="referto">Referto</option>
                    <option value="ricevuta">Ricevuta</option>
                    <option value="prescrizione">Prescrizione</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Per</label>
                    <select value={uploadProfile} onChange={e => setUploadProfile(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={uploadFamily} onChange={e => setUploadFamily(e.target.checked)}
                  className="rounded" />
                <span className="text-xs text-gray-600">Visibile a tutta la famiglia</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Annulla
                </button>
                <button type="submit" disabled={uploading || !selectedFile}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: '#1D9E75' }}>
                  {uploading ? 'Caricamento...' : 'Carica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
