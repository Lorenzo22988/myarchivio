# MyArchivio — Guida completa all'installazione

## Cosa ottieni
- Calendario con appuntamenti (visite, pagamenti, scadenze)
- Archivio documenti con upload reale di PDF e immagini
- Accesso admin (email + password) + accesso membri (nome + PIN)
- Ogni membro vede i propri dati + quelli condivisi come "Famiglia"
- Ricerca full-text su eventi e documenti
- Confronto storico di esami e pagamenti nel tempo

---

## STEP 1 — Crea il progetto su Supabase (gratis)

1. Vai su **https://supabase.com** → "Start your project" → crea un account
2. Clicca **"New project"**
   - Nome: `myarchivio`
   - Password database: scegli una password sicura (salvala)
   - Regione: `West EU (Ireland)` o simile
3. Aspetta ~2 minuti che il progetto sia pronto

### Configura il database
4. Nel pannello Supabase vai su **SQL Editor** (icona del database a sinistra)
5. Clicca **"New query"**
6. Copia e incolla tutto il contenuto del file `supabase-schema.sql`
7. Clicca **"Run"** — dovresti vedere "Success"

### Crea il bucket Storage
8. Vai su **Storage** nel menu a sinistra
9. Clicca **"New bucket"**
   - Nome: `documents`
   - Spunta **"Private bucket"** (importante!)
10. Clicca "Save"

### Ottieni le chiavi API
11. Vai su **Settings → API** (ingranaggio in basso a sinistra)
12. Copia questi 3 valori:
    - **Project URL** (es. `https://abcxyz.supabase.co`)
    - **anon public key** (lunga stringa che inizia con `eyJ...`)
    - **service_role key** (lunga stringa, tienila segreta!)

---

## STEP 2 — Configura il progetto

Nella cartella del progetto, crea il file `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...la-tua-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...la-tua-service-role-key...
```

---

## STEP 3 — Test in locale (opzionale)

Assicurati di avere Node.js 18+ installato:

```bash
cd myarchivio
npm install
npm run dev
```

Apri **http://localhost:3000** — dovresti vedere la schermata di login.

---

## STEP 4 — Deploy su Vercel (gratis, online per sempre)

### Opzione A — Da GitHub (consigliato)
1. Crea un account su **https://github.com** se non ce l'hai
2. Crea un repository privato chiamato `myarchivio`
3. Carica i file (o usa `git push`)
4. Vai su **https://vercel.com** → "New Project" → importa il repo
5. Nella sezione **"Environment Variables"** aggiungi le 3 variabili del file `.env.local`
6. Clicca **"Deploy"** — in 2 minuti il sito è online!

### Opzione B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
# Seguire le istruzioni e inserire le variabili d'ambiente quando chiesto
```

---

## STEP 5 — Primo accesso e configurazione famiglia

1. Apri il tuo sito (es. `myarchivio.vercel.app`)
2. Clicca **"Prima volta? Crea la tua famiglia"**
3. Inserisci:
   - Nome famiglia (es. "Famiglia Rossi")
   - Tuo nome (es. "Marco") — diventi l'admin
   - Email e password
4. Clicca "Crea famiglia" → accedi alla dashboard

### Aggiungere i membri
5. In basso a sinistra clicca l'icona **Utenti** (👥)
6. Oppure vai su **https://tuo-sito.vercel.app/dashboard/admin**
7. Per ogni membro:
   - Inserisci nome (es. "Lucia")
   - Scegli ruolo (adulto/bambino/anziano)
   - Assegna un PIN (es. "1234")
   - Scegli un colore
   - Clicca "Aggiungi membro"

### Come accedono i membri
- Vanno sullo stesso sito
- Cliccano **"Accesso membro"**
- Inseriscono nome + PIN
- Vedono i propri dati + quelli condivisi della famiglia

---

## Struttura permessi

| Chi | Vede |
|-----|------|
| **Admin** | Tutti gli eventi e documenti di tutta la famiglia |
| **Membro** | I propri eventi + quelli marcati "Famiglia" |

Quando crei un evento o carichi un documento, puoi spuntare
**"Visibile a tutta la famiglia"** per condividerlo con tutti.

---

## Limiti del piano gratuito

| Servizio | Limite gratuito |
|----------|----------------|
| Supabase DB | 500 MB |
| Supabase Storage | 1 GB |
| Vercel | Illimitato per uso personale |

Per una famiglia normale questi limiti non si raggiungono mai.

---

## Supporto file supportati

- PDF (referti, ricevute, contratti)
- Immagini: JPG, PNG, WebP
- Documenti Word: DOC, DOCX

Dimensione massima per file: 50 MB (configurabile in Supabase)
