# Hidden Karate Dojo

Tränarportal för en karateklubb byggd som en statisk `Vite + React`-app med Supabase för auth, data och Edge Functions. UI:t följer den handoffade HTML-prototypen, medan känsligare operationer ligger i Supabase.

## Krav

- Node.js 20+
- Ett Supabase-projekt

## Kom igång

1. Installera beroenden:

```bash
npm install
```

2. Skapa `.env.local` från exemplet och fyll i värden:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Kör migrationerna i `supabase/migrations/`.

4. Deploya Edge Functions i `supabase/functions/`.

5. Skapa eller uppdatera en coach-användare:

```bash
npm run create:coach -- --email coach@hiddenkaratedojo.se --password ditt-losenord
```

6. Starta utvecklingsservern:

```bash
npm run dev
```

## Verifiering

```bash
npm test
npm run lint
npm run build
```

## Funktioner

- E-post/lösenord-login via Supabase
- Medlemmar med soft delete och separat permanent radering
- Läger med inline-toggling av deltagare
- Träningsregistrering med datumstyrda checkcards
- Närvarovy med sammanställd procent över all historik
- CSV- och PDF-export för medlemslista och närvaro
- Auditlogg och permanent delete via Supabase Edge Functions
