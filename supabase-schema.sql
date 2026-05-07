-- ============================================================
-- MyArchivio — Schema Supabase
-- Esegui questo file nell'editor SQL di Supabase
-- ============================================================

-- 1. FAMIGLIE
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. PROFILI UTENTE (admin + membri)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  initials text not null,
  color text not null default '#1D9E75',
  color_light text not null default '#E1F5EE',
  color_dark text not null default '#085041',
  role text not null default 'membro', -- 'admin' | 'membro'
  member_role text not null default 'adulto', -- 'adulto' | 'bambino' | 'anziano'
  pin_hash text, -- hash bcrypt del PIN (solo per membri non-admin)
  supabase_user_id uuid, -- collegato a auth.users solo per l'admin
  created_at timestamptz default now()
);

-- 3. EVENTI / APPUNTAMENTI
create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  date date not null,
  time time,
  category text not null default 'altro', -- 'visita' | 'pagamento' | 'scadenza' | 'altro'
  note text,
  is_family boolean not null default false, -- visibile a tutta la famiglia
  created_at timestamptz default now()
);

-- 4. DOCUMENTI
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  doc_type text not null default 'altro', -- 'referto' | 'ricevuta' | 'prescrizione' | 'altro'
  file_path text not null, -- path in Supabase Storage
  file_size integer,
  mime_type text,
  is_family boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.documents enable row level security;

-- Le policy usano una funzione helper che legge il profilo attivo
-- dalla sessione (passato come header custom o claim JWT)

-- FAMIGLIE: chiunque autenticato può leggere la propria famiglia
create policy "famiglia propria" on public.families
  for all using (
    id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid()
    )
  );

-- PROFILI: admin vede tutti i profili della famiglia
create policy "profili famiglia" on public.profiles
  for select using (
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid()
    )
  );

create policy "admin gestisce profili" on public.profiles
  for all using (
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid() and role = 'admin'
    )
  );

-- EVENTI: vedi i tuoi + quelli family della tua famiglia
create policy "eventi visibili" on public.events
  for select using (
    -- eventi tuoi
    profile_id in (
      select id from public.profiles
      where supabase_user_id = auth.uid()
    )
    or
    -- eventi family della tua famiglia
    (is_family = true and family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid()
    ))
    or
    -- admin vede tutto
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "eventi insert" on public.events
  for insert with check (
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid()
    )
  );

create policy "eventi update delete" on public.events
  for all using (
    profile_id in (
      select id from public.profiles where supabase_user_id = auth.uid()
    )
    or
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid() and role = 'admin'
    )
  );

-- DOCUMENTI: stessa logica degli eventi
create policy "documenti visibili" on public.documents
  for select using (
    profile_id in (
      select id from public.profiles where supabase_user_id = auth.uid()
    )
    or
    (is_family = true and family_id in (
      select family_id from public.profiles where supabase_user_id = auth.uid()
    ))
    or
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "documenti insert" on public.documents
  for insert with check (
    family_id in (
      select family_id from public.profiles where supabase_user_id = auth.uid()
    )
  );

create policy "documenti update delete" on public.documents
  for all using (
    profile_id in (
      select id from public.profiles where supabase_user_id = auth.uid()
    )
    or
    family_id in (
      select family_id from public.profiles
      where supabase_user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- STORAGE
-- ============================================================

-- Crea il bucket "documents" in Supabase Storage (Dashboard > Storage)
-- oppure via SQL:
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

-- Policy storage: solo chi appartiene alla famiglia può leggere/scrivere
create policy "storage famiglia" on storage.objects
  for all using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (
      select family_id::text from public.profiles
      where supabase_user_id = auth.uid()
    )
  );
