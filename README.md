# Hidden Karate Dojo

En tränarportal för karateklubben byggd med `Vite`, `React` och `Supabase`.

## Innehåll

- e-post/lösenord-login via Supabase Auth
- medlemshantering med create, edit, soft delete och permanent delete
- läger och tävlingar med närvarotoggling
- träningsregistrering per datum
- närvarovy över hela historiken
- CSV- och PDF-export
- auditlogg och permanent delete via Supabase Edge Functions

## Teknik

- frontend: `Vite + React + React Router`
- databas och auth: `Supabase`
- PDF-export: `pdf-lib`
- tester: `Vitest + Testing Library`

## Krav

- Node.js 20+
- ett Supabase-projekt

## Miljövariabler

Skapa en lokal `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` används bara av det lokala hjälpskriptet för att skapa eller uppdatera coach-användare.

## Starta projektet

Installera beroenden:

```bash
npm install
```

Starta utvecklingsservern:

```bash
npm run dev
```

Appen körs lokalt på:

```text
http://localhost:5173
```

## Skapa coach-användare

```bash
npm run create:coach -- --email coach@hiddenkaratedojo.se --password ditt-losenord
```

## Supabase-delar

SQL-migrationer finns i `supabase/migrations`:

- `001_initial.sql`
- `002_client_rls_and_edge_support.sql`
- `003_fix_member_belt_encoding.sql`

Edge Functions finns i `supabase/functions`:

- `audit-log-write`
- `member-delete-permanent`

## Vanliga kommandon

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Verifierad status

Följande är testat och fungerar:

- login
- skapa medlem
- redigera medlem
- soft delete
- permanent delete
- skapa läger och toggla närvaro
- spara träningspass
- närvarovy
- CSV-export
- PDF-export
