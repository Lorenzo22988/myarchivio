export type MemberRole = 'admin' | 'membro'
export type MemberType = 'adulto' | 'bambino' | 'anziano'
export type EventCategory = 'visita' | 'pagamento' | 'scadenza' | 'altro'
export type DocType = 'referto' | 'ricevuta' | 'prescrizione' | 'altro'

export interface Family {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  family_id: string
  name: string
  initials: string
  color: string
  color_light: string
  color_dark: string
  role: MemberRole
  member_role: MemberType
  supabase_user_id?: string
  created_at: string
}

export interface Event {
  id: string
  family_id: string
  profile_id: string
  title: string
  date: string
  time?: string
  category: EventCategory
  note?: string
  is_family: boolean
  created_at: string
  profile?: Profile
  documents?: Document[]
}

export interface Document {
  id: string
  event_id?: string
  family_id: string
  profile_id: string
  name: string
  doc_type: DocType
  file_path: string
  file_size?: number
  mime_type?: string
  is_family: boolean
  created_at: string
  profile?: Profile
  signed_url?: string
}

export const CAT_CONFIG: Record<EventCategory, { label: string; colorClass: string; badgeClass: string }> = {
  visita:     { label: 'Visita',     colorClass: 'bg-teal-50 text-teal-800',   badgeClass: 'bg-[#E1F5EE] text-[#085041]' },
  pagamento:  { label: 'Pagamento',  colorClass: 'bg-green-50 text-green-800', badgeClass: 'bg-[#EAF3DE] text-[#27500A]' },
  scadenza:   { label: 'Scadenza',   colorClass: 'bg-amber-50 text-amber-800', badgeClass: 'bg-[#FAEEDA] text-[#633806]' },
  altro:      { label: 'Altro',      colorClass: 'bg-purple-50 text-purple-800',badgeClass: 'bg-[#EEEDFE] text-[#3C3489]' },
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  referto:      'Referto',
  ricevuta:     'Ricevuta',
  prescrizione: 'Prescrizione',
  altro:        'Documento',
}

export const COLORS = [
  { color: '#1D9E75', light: '#E1F5EE', dark: '#085041', label: 'Verde'   },
  { color: '#378ADD', light: '#E6F1FB', dark: '#0C447C', label: 'Blu'     },
  { color: '#D4537E', light: '#FBEAF0', dark: '#72243E', label: 'Rosa'    },
  { color: '#7F77DD', light: '#EEEDFE', dark: '#3C3489', label: 'Viola'   },
  { color: '#EF9F27', light: '#FAEEDA', dark: '#633806', label: 'Arancio' },
]
