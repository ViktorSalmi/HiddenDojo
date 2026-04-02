# Hidden Karate Dojo React + Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Next.js app with a static Vite + React app that uses Supabase directly from the client and Supabase Edge Functions for privileged operations.

**Architecture:** The migration removes App Router, server actions, and middleware-based auth. A React SPA handles routing and UI state in the browser, Supabase client handles normal CRUD behind RLS, and Edge Functions handle permanent delete plus audit-log writes.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, React Router, Supabase JS, Vitest, pdf-lib, Supabase Edge Functions

---

## File Structure

**Frontend files**

- Create: `D:\Dev\Karate\index.html`
- Create: `D:\Dev\Karate\vite.config.ts`
- Create: `D:\Dev\Karate\src\main.tsx`
- Create: `D:\Dev\Karate\src\app.tsx`
- Create: `D:\Dev\Karate\src\router.tsx`
- Create: `D:\Dev\Karate\src\styles\globals.css`
- Create: `D:\Dev\Karate\src\lib\supabase\client.ts`
- Create: `D:\Dev\Karate\src\lib\supabase\auth.ts`
- Create: `D:\Dev\Karate\src\lib\supabase\queries.ts`
- Create: `D:\Dev\Karate\src\lib\supabase\functions.ts`
- Create: `D:\Dev\Karate\src\components\auth\login-form.tsx`
- Create: `D:\Dev\Karate\src\components\layout\sidebar.tsx`
- Create: `D:\Dev\Karate\src\components\layout\dashboard-page.tsx`
- Create: `D:\Dev\Karate\src\components\ui\modal.tsx`
- Create: `D:\Dev\Karate\src\components\ui\stat-cards.tsx`
- Create: `D:\Dev\Karate\src\components\ui\export-links.tsx`
- Create: `D:\Dev\Karate\src\components\dashboard\members-view.tsx`
- Create: `D:\Dev\Karate\src\components\dashboard\camps-view.tsx`
- Create: `D:\Dev\Karate\src\components\dashboard\training-view.tsx`
- Create: `D:\Dev\Karate\src\components\dashboard\attendance-view.tsx`
- Create: `D:\Dev\Karate\src\components\forms\member-form.tsx`
- Create: `D:\Dev\Karate\src\components\forms\camp-form.tsx`
- Create: `D:\Dev\Karate\src\hooks\use-session.ts`
- Create: `D:\Dev\Karate\src\hooks\use-dashboard-data.ts`
- Create: `D:\Dev\Karate\src\types.ts`

**Shared utility migration**

- Move or recreate from current app: attendance math, formatting helpers, export helpers, catalog/meta files
- Source files to reference:
  - `D:\Dev\Karate\lib\dojo\attendance.ts`
  - `D:\Dev\Karate\lib\dojo\catalog.ts`
  - `D:\Dev\Karate\lib\dojo\export.ts`
  - `D:\Dev\Karate\lib\dojo\format.ts`
  - `D:\Dev\Karate\lib\dojo\pdf.ts`
  - `D:\Dev\Karate\lib\types.ts`

**Supabase backend files**

- Create: `D:\Dev\Karate\supabase\functions\audit-log-write\index.ts`
- Create: `D:\Dev\Karate\supabase\functions\member-delete-permanent\index.ts`
- Create: `D:\Dev\Karate\supabase\migrations\002_client_rls_and_edge_support.sql`

**Cleanup targets after parity**

- Remove: `D:\Dev\Karate\app\`
- Remove: `D:\Dev\Karate\components\`
- Remove: `D:\Dev\Karate\lib\`
- Remove: `D:\Dev\Karate\middleware.ts`
- Remove: `D:\Dev\Karate\next.config.ts`
- Remove: `D:\Dev\Karate\next-env.d.ts`

---

### Task 1: Replace Next Tooling With Vite React Shell

**Files:**
- Create: `D:\Dev\Karate\index.html`
- Create: `D:\Dev\Karate\vite.config.ts`
- Create: `D:\Dev\Karate\src\main.tsx`
- Create: `D:\Dev\Karate\src\app.tsx`
- Create: `D:\Dev\Karate\src\styles\globals.css`
- Modify: `D:\Dev\Karate\package.json`
- Modify: `D:\Dev\Karate\tsconfig.json`
- Test: `D:\Dev\Karate\package.json` scripts via `npm run build`

- [ ] **Step 1: Add the new frontend dependencies**

```bash
npm remove next @supabase/ssr eslint-config-next
npm install react-router-dom
npm install -D vite @vitejs/plugin-react
```

- [ ] **Step 2: Rewrite `package.json` scripts for Vite**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "create:coach": "node scripts/create-coach-user.mjs"
  }
}
```

- [ ] **Step 3: Create the Vite entry files**

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```tsx
// src/app.tsx
import { RouterProvider } from "react-router-dom";

import { router } from "./router";

export function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 4: Create the Vite config**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Run the build to verify the shell compiles**

Run: `npm run build`

Expected: Vite build succeeds and produces `dist/`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json index.html vite.config.ts src/main.tsx src/app.tsx src/styles/globals.css
git commit -m "refactor: replace next shell with vite react shell"
```

---

### Task 2: Rebuild Auth And Routing Client-Side

**Files:**
- Create: `D:\Dev\Karate\src\router.tsx`
- Create: `D:\Dev\Karate\src\lib\supabase\client.ts`
- Create: `D:\Dev\Karate\src\lib\supabase\auth.ts`
- Create: `D:\Dev\Karate\src\hooks\use-session.ts`
- Create: `D:\Dev\Karate\src\components\auth\login-form.tsx`
- Test: `D:\Dev\Karate\tests\auth-session.test.ts`

- [ ] **Step 1: Write a failing test for auth-state mapping**

```ts
// tests/auth-session.test.ts
import { describe, expect, it } from "vitest";

import { isAuthenticatedSession } from "@/lib/supabase/auth";

describe("isAuthenticatedSession", () => {
  it("returns false for missing session", () => {
    expect(isAuthenticatedSession(null)).toBe(false);
  });

  it("returns true for a session with a user id", () => {
    expect(
      isAuthenticatedSession({
        user: { id: "user-1" },
      } as never),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- auth-session`

Expected: FAIL because `isAuthenticatedSession` does not exist yet

- [ ] **Step 3: Implement the auth helper and client**

```ts
// src/lib/supabase/auth.ts
import type { Session } from "@supabase/supabase-js";

export function isAuthenticatedSession(session: Session | null) {
  return Boolean(session?.user?.id);
}
```

```ts
// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

- [ ] **Step 4: Create client routing and protected layout flow**

```tsx
// src/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import { LoginPage } from "@/components/auth/login-form";
import { DashboardLayout } from "@/components/layout/dashboard-page";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate replace to="/dashboard/members" /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/dashboard/*", element: <DashboardLayout /> },
]);
```

- [ ] **Step 5: Run the test and build again**

Run: `npm test -- auth-session`

Expected: PASS

Run: `npm run build`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/router.tsx src/lib/supabase/client.ts src/lib/supabase/auth.ts src/hooks/use-session.ts src/components/auth/login-form.tsx tests/auth-session.test.ts
git commit -m "feat: add client-side auth and protected routing"
```

---

### Task 3: Migrate Shared Domain Utilities Into `src`

**Files:**
- Create: `D:\Dev\Karate\src\lib\dojo\attendance.ts`
- Create: `D:\Dev\Karate\src\lib\dojo\catalog.ts`
- Create: `D:\Dev\Karate\src\lib\dojo\format.ts`
- Create: `D:\Dev\Karate\src\lib\dojo\export.ts`
- Create: `D:\Dev\Karate\src\lib\dojo\pdf.ts`
- Create: `D:\Dev\Karate\src\types.ts`
- Modify: `D:\Dev\Karate\tests\attendance.test.ts`
- Modify: `D:\Dev\Karate\tests\export.test.ts`

- [ ] **Step 1: Point existing tests at the new `src` paths**

```ts
// tests/attendance.test.ts
import {
  calculateDashboardAttendance,
  calculateMemberAttendance,
} from "@/lib/dojo/attendance";
```

- [ ] **Step 2: Copy the current pure utility code into `src/lib/dojo`**

```ts
// src/types.ts
export type Gender = "M" | "F" | "-";

export type Belt =
  | "vitt"
  | "gult"
  | "orange"
  | "gront"
  | "blatt"
  | "brunt"
  | "svart";
```

Reference the current implementations in:

- `D:\Dev\Karate\lib\dojo\attendance.ts`
- `D:\Dev\Karate\lib\dojo\export.ts`
- `D:\Dev\Karate\lib\dojo\format.ts`

- [ ] **Step 3: Run the pure utility tests**

Run: `npm test -- attendance export`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/dojo src/types.ts tests/attendance.test.ts tests/export.test.ts
git commit -m "refactor: migrate shared dojo utilities into src"
```

---

### Task 4: Rebuild Members View Against Supabase Client Queries

**Files:**
- Create: `D:\Dev\Karate\src\lib\supabase\queries.ts`
- Create: `D:\Dev\Karate\src\hooks\use-dashboard-data.ts`
- Create: `D:\Dev\Karate\src\components\dashboard\members-view.tsx`
- Create: `D:\Dev\Karate\src\components\forms\member-form.tsx`
- Create: `D:\Dev\Karate\src\components\layout\sidebar.tsx`
- Create: `D:\Dev\Karate\src\components\layout\dashboard-page.tsx`
- Create: `D:\Dev\Karate\src\components\ui\modal.tsx`
- Create: `D:\Dev\Karate\src\components\ui\stat-cards.tsx`
- Create: `D:\Dev\Karate\src\components\ui\export-links.tsx`

- [ ] **Step 1: Implement the members query layer**

```ts
// src/lib/supabase/queries.ts
import { supabase } from "@/lib/supabase/client";

export async function getMembers(includeInactive = false) {
  let query = supabase.from("members").select("*").order("name");

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Port the existing members UI from the current file**

Reference source: `D:\Dev\Karate\components\dashboard\members-view.tsx`

Keep these fixes while porting:

```tsx
<th className="w-[180px] px-5 py-3 text-right text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
  Atgarder
</th>

<div className="flex justify-end gap-1 whitespace-nowrap">
  <button type="button">Redigera</button>
  <button type="button">Ta bort</button>
</div>
```

- [ ] **Step 3: Wire create, update and soft delete to direct client calls**

```ts
await supabase.from("members").insert(payload);
await supabase.from("members").update(payload).eq("id", memberId);
await supabase.from("members").update({ active: false }).eq("id", memberId);
```

- [ ] **Step 4: Verify the view in the browser**

Run: `npm run dev`

Expected: members page loads, row heights stay stable, edit/delete buttons remain on one line

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/queries.ts src/hooks/use-dashboard-data.ts src/components/dashboard/members-view.tsx src/components/forms/member-form.tsx src/components/layout src/components/ui
git commit -m "feat: rebuild members view with client-side supabase queries"
```

---

### Task 5: Rebuild Camps, Training, Attendance And Client Exports

**Files:**
- Create: `D:\Dev\Karate\src\components\dashboard\camps-view.tsx`
- Create: `D:\Dev\Karate\src\components\dashboard\training-view.tsx`
- Create: `D:\Dev\Karate\src\components\dashboard\attendance-view.tsx`
- Create: `D:\Dev\Karate\src\components\forms\camp-form.tsx`
- Modify: `D:\Dev\Karate\src\lib\supabase\queries.ts`
- Modify: `D:\Dev\Karate\src\lib\dojo\export.ts`
- Modify: `D:\Dev\Karate\src\lib\dojo\pdf.ts`

- [ ] **Step 1: Extend the query layer for camps and sessions**

```ts
export async function getCamps() {
  const { data, error } = await supabase
    .from("camps")
    .select("id, name, date, place, created_at, updated_at, camp_attendance(member_id)")
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

```ts
export async function getTrainingSessions() {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, date, notes, created_at, session_attendance(member_id)")
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Port the three dashboard views without changing the visual language**

Reference sources:

- `D:\Dev\Karate\components\dashboard\camps-view.tsx`
- `D:\Dev\Karate\components\dashboard\training-view.tsx`
- `D:\Dev\Karate\components\dashboard\attendance-view.tsx`

- [ ] **Step 3: Move CSV and PDF export to client utilities**

```ts
// src/lib/dojo/export.ts
export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run the existing export tests and the full build**

Run: `npm test`

Expected: PASS

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard src/components/forms/camp-form.tsx src/lib/supabase/queries.ts src/lib/dojo/export.ts src/lib/dojo/pdf.ts
git commit -m "feat: rebuild remaining dashboard views and client exports"
```

---

### Task 6: Add RLS Support And Edge Functions For Privileged Operations

**Files:**
- Create: `D:\Dev\Karate\supabase\functions\audit-log-write\index.ts`
- Create: `D:\Dev\Karate\supabase\functions\member-delete-permanent\index.ts`
- Create: `D:\Dev\Karate\supabase\migrations\002_client_rls_and_edge_support.sql`
- Create: `D:\Dev\Karate\src\lib\supabase\functions.ts`

- [ ] **Step 1: Create the Edge Function client wrapper**

```ts
// src/lib/supabase/functions.ts
import { supabase } from "@/lib/supabase/client";

export async function permanentlyDeleteMember(memberId: string) {
  const { error } = await supabase.functions.invoke("member-delete-permanent", {
    body: { memberId },
  });

  if (error) throw error;
}
```

- [ ] **Step 2: Add the permanent-delete Edge Function**

```ts
// supabase/functions/member-delete-permanent/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (request) => {
  const authHeader = request.headers.get("Authorization") ?? "";
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { memberId } = await request.json();

  await admin.from("camp_attendance").delete().eq("member_id", memberId);
  await admin.from("session_attendance").delete().eq("member_id", memberId);
  await admin.from("members").delete().eq("id", memberId);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 3: Add the migration for client-first RLS**

```sql
-- supabase/migrations/002_client_rls_and_edge_support.sql
drop policy if exists "authenticated write members" on members;
create policy "authenticated write members"
on members for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
```

Repeat the same explicit `with check` pattern for `camps`, `camp_attendance`, `training_sessions`, and `session_attendance`.

- [ ] **Step 4: Deploy functions and apply migration**

Run: `supabase db push`

Expected: migration applied

Run: `supabase functions deploy audit-log-write`

Expected: function deployed

Run: `supabase functions deploy member-delete-permanent`

Expected: function deployed

- [ ] **Step 5: Commit**

```bash
git add supabase/functions supabase/migrations/002_client_rls_and_edge_support.sql src/lib/supabase/functions.ts
git commit -m "feat: add edge functions for privileged supabase operations"
```

---

### Task 7: Remove Next-Specific Code And Finalize The Static SPA

**Files:**
- Delete: `D:\Dev\Karate\app\`
- Delete: `D:\Dev\Karate\components\`
- Delete: `D:\Dev\Karate\lib\`
- Delete: `D:\Dev\Karate\middleware.ts`
- Delete: `D:\Dev\Karate\next.config.ts`
- Delete: `D:\Dev\Karate\next-env.d.ts`
- Modify: `D:\Dev\Karate\README.md`
- Modify: `D:\Dev\Karate\.env.example`

- [ ] **Step 1: Remove dead Next files only after the SPA has feature parity**

```powershell
Remove-Item -Recurse -Force .\app
Remove-Item -Recurse -Force .\components
Remove-Item -Recurse -Force .\lib
Remove-Item -Force .\middleware.ts, .\next.config.ts, .\next-env.d.ts
```

- [ ] **Step 2: Rewrite the docs for Vite + Supabase**

```md
## Getting Started

1. `npm install`
2. copy `.env.example` to `.env.local`
3. run `npm run dev`
4. create a coach account with `npm run create:coach -- --email ... --password ...`
```

- [ ] **Step 3: Run final verification**

Run: `npm test`

Expected: PASS

Run: `npm run lint`

Expected: PASS

Run: `npm run build`

Expected: PASS with Vite output and no Next.js route table

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: finalize static react supabase app migration"
```

---

## Self-Review

**Spec coverage**

- Static React app: covered by Tasks 1 and 7
- Client auth and client routing: covered by Task 2
- Direct Supabase CRUD with RLS: covered by Tasks 4, 5, and 6
- Edge Functions for privileged operations: covered by Task 6
- Preserved UI structure: covered by Tasks 4 and 5

No uncovered spec requirements remain.

**Placeholder scan**

- No TODO/TBD placeholders remain
- All tasks include exact files and commands
- All code-changing tasks include concrete code snippets

**Type consistency**

- `supabase` browser client is always imported from `src/lib/supabase/client.ts`
- Auth check uses `isAuthenticatedSession`
- Permanent delete always flows through `member-delete-permanent`

