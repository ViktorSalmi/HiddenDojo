# Hidden Karate Dojo — Projektspecifikation

> Handoff-dokument för Claude Code. Läs hela filen innan du skriver en enda rad kod.

---

## Projektöversikt

En GDPR-kompatibel tränarportal för en karateklubb. Coachen loggar in via magic link och hanterar medlemmar, träningspass och läger. All data lagras i Supabase (EU). Ingen känslig logik eller databasnyckel exponeras i webbläsaren.

**Domän:** befintlig domän på one.com (DNS-peka till Vercel, detaljer senare)
**Antal klubbar:** 1
**Användare:** tränare/coach (1–3 personer)
**Målgrupp för data:** minderåriga elever → extra GDPR-hänsyn

---

## Stack

| Lager | Val | Motivering |
|---|---|---|
| Frontend + backend | Next.js 14 (App Router) | Server Components håller nycklar server-side |
| Hosting | Vercel | Gratis tier, trivialt att koppla domän |
| Databas + auth | Supabase (region: `eu-central-1`, Frankfurt) | PostgreSQL, RLS, magic link inbyggt, EU |
| ORM | Supabase JS SDK (server-side only) | Direkt, ingen overhead |
| Styling | Tailwind CSS | Snabbt, konsistent |
| Språk | TypeScript | Obligatoriskt |

---

## Projektstruktur

```
hidden-karate-dojo/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← redirect → /login eller /dashboard
│   ├── login/
│   │   └── page.tsx              ← magic link-formulär
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          ← Supabase auth callback
│   └── dashboard/
│       ├── layout.tsx            ← autentiseringsskydd (server-side)
│       ├── page.tsx              ← redirect → /dashboard/members
│       ├── members/
│       │   ├── page.tsx
│       │   └── actions.ts        ← Server Actions: add/edit/delete
│       ├── camps/
│       │   ├── page.tsx
│       │   └── actions.ts
│       ├── training/
│       │   ├── page.tsx
│       │   └── actions.ts
│       └── attendance/
│           └── page.tsx
├── components/
│   ├── ui/                       ← Sidebar, Topbar, StatCard, Table, Modal, Toast
│   └── forms/                    ← MemberForm, CampForm, TrainingForm
├── lib/
│   ├── supabase/
│   │   ├── server.ts             ← createServerClient (cookies)
│   │   └── client.ts             ← createBrowserClient (endast för auth UI)
│   └── types.ts                  ← TypeScript-typer för DB-tabeller
├── middleware.ts                 ← skyddar /dashboard/** utan inloggning
├── .env.local                    ← ALDRIG committas
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

---

## Miljövariabler

Skapa `.env.local` (lägg till i `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[projekt].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # används ALDRIG client-side
```

`NEXT_PUBLIC_`-variablerna är publika men ofarliga — Supabase RLS gör att de inte kan missbrukas.
`SERVICE_ROLE_KEY` används bara i Server Actions och API-routes.

---

## Databas — SQL-migrationer

Kör i Supabase SQL Editor eller via `supabase db push`.

### `001_initial.sql`

```sql
-- ═══════════════════════════════════════════
-- TABELLER
-- ═══════════════════════════════════════════

create table members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  age         int not null check (age between 5 and 99),
  gender      text check (gender in ('M', 'F', '-')),
  belt        text not null check (belt in ('vitt','gult','orange','grönt','blått','brunt','svart')),
  joined_date date not null default current_date,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table camps (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  date       date not null,
  place      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table camp_attendance (
  camp_id   uuid references camps(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (camp_id, member_id)
);

create table training_sessions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  notes      text,
  created_at timestamptz default now()
);

create table session_attendance (
  session_id uuid references training_sessions(id) on delete cascade,
  member_id  uuid references members(id) on delete cascade,
  primary key (session_id, member_id)
);

-- GDPR-revisionsspår
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  user_email  text not null,
  action      text not null,   -- 'create' | 'update' | 'delete'
  table_name  text not null,
  record_id   uuid,
  detail      jsonb,
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════

alter table members           enable row level security;
alter table camps             enable row level security;
alter table camp_attendance   enable row level security;
alter table training_sessions enable row level security;
alter table session_attendance enable row level security;
alter table audit_log         enable row level security;

create policy "Inloggad kan läsa members"
  on members for select using (auth.role() = 'authenticated');

create policy "Inloggad kan skriva members"
  on members for all using (auth.role() = 'authenticated');

create policy "Inloggad kan läsa camps"
  on camps for select using (auth.role() = 'authenticated');

create policy "Inloggad kan skriva camps"
  on camps for all using (auth.role() = 'authenticated');

create policy "Inloggad kan läsa camp_attendance"
  on camp_attendance for select using (auth.role() = 'authenticated');

create policy "Inloggad kan skriva camp_attendance"
  on camp_attendance for all using (auth.role() = 'authenticated');

create policy "Inloggad kan läsa training_sessions"
  on training_sessions for select using (auth.role() = 'authenticated');

create policy "Inloggad kan skriva training_sessions"
  on training_sessions for all using (auth.role() = 'authenticated');

create policy "Inloggad kan läsa session_attendance"
  on session_attendance for select using (auth.role() = 'authenticated');

create policy "Inloggad kan skriva session_attendance"
  on session_attendance for all using (auth.role() = 'authenticated');

create policy "Inloggad kan läsa audit_log"
  on audit_log for select using (auth.role() = 'authenticated');

-- audit_log skrivs bara via service role (Server Actions), inte direkt
create policy "Ingen direkt skrivning audit_log"
  on audit_log for insert using (false);

-- ═══════════════════════════════════════════
-- TRIGGERS — updated_at
-- ═══════════════════════════════════════════

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_members_updated_at
  before update on members
  for each row execute function update_updated_at();

create trigger trg_camps_updated_at
  before update on camps
  for each row execute function update_updated_at();
```

---

## Autentisering — magic link

Supabase Auth hanterar allt. Flödet:

```
1. Coach anger sin e-post på /login
2. Supabase skickar magic link till e-posten
3. Coach klickar länken → redirectas till /auth/callback
4. Callback-routen utbyter token mot session (httpOnly cookie)
5. Middleware skyddar /dashboard/** — ingen session → redirect till /login
```

### `middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie helpers */ } }
  )
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = { matcher: ['/dashboard/:path*'] }
```

### `app/auth/callback/route.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = createServerClient(/* ... */)
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

Konfigurera i Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://dindomän.se`
- **Redirect URLs:** `https://dindomän.se/auth/callback`

---

## Server Actions — exempel members

All databaslogik körs server-side. Aldrig `supabase` i en Client Component.

```typescript
// app/dashboard/members/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addMember(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const member = {
    name:        formData.get('name') as string,
    age:         Number(formData.get('age')),
    gender:      formData.get('gender') as string,
    belt:        formData.get('belt') as string,
    joined_date: formData.get('joined_date') as string,
  }

  const { data, error } = await supabase.from('members').insert(member).select().single()
  if (error) throw error

  await logAudit(user.email!, 'create', 'members', data.id, member)
  revalidatePath('/dashboard/members')
}

export async function deleteMember(id: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Soft delete — sätter active=false per GDPR-policy
  await supabase.from('members').update({ active: false }).eq('id', id)
  await logAudit(user.email!, 'delete', 'members', id, {})
  revalidatePath('/dashboard/members')
}

async function logAudit(userEmail: string, action: string, table: string, recordId: string, detail: object) {
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.from('audit_log').insert({ user_email: userEmail, action, table_name: table, record_id: recordId, detail })
}
```

---

## Design — specifikation

Behåll exakt samma visuella identitet som den befintliga HTML-prototypen.

### Tokens

```css
--sidebar:    #131313
--red:        #c0281a
--red2:       #e8392a
--red-pale:   #fdf0ee
--paper:      #f5f3ee
--surface:    #ffffff
--border:     #e4dfd7
--ink:        #0e0e0e
--ink2:       #444444
--ink3:       #888888
--green:      #2d7a4f
--gold:       #c8973a
--radius-sm:  6px
--radius-md:  10px
--radius-lg:  14px
```

### Typografi

- **Display/rubriker:** `Syne` (Google Fonts), weight 700–800
- **Brödtext/UI:** `Inter`, weight 400–500
- Importera via `next/font/google` — inte via `<link>` i HTML

### Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar 240px (mörk)  │  Main (flex 1)      │
│                        │  ┌─ Topbar 58px ─┐  │
│  Logo                  │  │ Titel + actions│  │
│  Nav items             │  └───────────────┘  │
│                        │  ┌─ Content ──────┐  │
│  ─────────────────     │  │ Stat cards     │  │
│  Stat summary          │  │ Table / grid   │  │
│  Copyright             │  └───────────────┘  │
└─────────────────────────────────────────────┘
```

### Sidor och komponenter att bygga

#### Sidebar
- Logo med hexagon-ikon + "Hidden Karate Dojo" / "Tränarportalen"
- Nav: Medlemmar, Läger & tävlingar, Närvaro, Registrera träning
- Aktiv sida markerad med röd vänsterbård + röd text
- Botten: antal aktiva + snitt-närvaro + logga ut-knapp

#### Topbar
- Sidtitel (h1-nivå, Syne 800)
- Höger: kontextuell sökruta + primär action-knapp (röd)

#### Stat cards (4 st)
- Röd/gold/grön/blå topbård
- Stort nummer (Syne 700, 30px) + liten etikett

#### Medlemstabellen
- Kolumner: Avatar-cirkel | Namn + kön | Ålder | Bälte-pill | Sedan | Närvaro-pill | Redigera + Ta bort
- Bälte-pill: färgad bakgrund (bältets färg) + färgad punkt
- Närvaro-pill: grön ≥80%, gul 60–79%, röd <60%
- Bältefilter-chips ovanför tabellen
- Sök filtrerar live

#### Läger-grid
- `auto-fill, minmax(340px, 1fr)`
- Varje kort: namn + datum/plats, deltagarräknare-badge, elevchips (grön=med, grå=ej med)
- Klick på elevchip togglar närvaro inline
- Redigera/ta bort via ikonknappar

#### Träningsregistrering
- Datumväljare + "Markera alla" / "Rensa"
- Checkcard-grid: avatar + namn + bälte, klick togglar grön markering
- Spara-knapp → Server Action
- Historiklogg under med möjlighet att ta bort pass

#### Närvaro-tabell
- Kolumner: Avatar | Namn | Bälte | Läger X/Y | Träningar X/Y | Progress-bar | %
- Sorterad fallande på %

#### Login-sida (`/login`)
- Centrerad, minimalistisk
- Logo + klubbnamn
- Email-input + "Skicka magic link"-knapp
- Bekräftelsemeddelande efter skickat

#### Modaler
- Overlay med `rgba(0,0,0,0.5)` bakgrund
- Vit kortad med border-radius 14px
- Titel (Syne 800) + formulär + Avbryt/Spara-knappar
- Stäng på Escape och klick utanför
- Delete-modaler: röd bekräftelseknapp, varningstext

#### Toast-notiser
- Höger nere, mörk bakgrund, 2.2s
- Används för: "Uppgifter sparade", "Elev borttagen" osv.

---

## GDPR — implementation

### Vad som lagras
- Namn, ålder, kön, bältesnivå, startdatum för minderåriga elever
- Närvaro per träning och läger
- Inget personnummer, ingen adress, ingen kontaktinfo

### Åtgärder i koden
1. **Audit log** — varje create/update/delete skrivs till `audit_log` med användarens e-post och tidsstämpel
2. **Soft delete** — `active = false` på members istället för riktig radering, tills man explicit tömmer
3. **Rätt till radering** — admin-funktion som permanent raderar en members alla rader inkl. attendance
4. **Supabase RLS** — dataisolering på databasnivå
5. **httpOnly cookies** — sessioner lagras inte i localStorage

---

## Kommandosekvens — kom igång

```bash
npx create-next-app@latest hidden-karate-dojo \
  --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd hidden-karate-dojo
npm install @supabase/supabase-js @supabase/ssr
```

---

*Specifikation sparad: 2026-04-02*
