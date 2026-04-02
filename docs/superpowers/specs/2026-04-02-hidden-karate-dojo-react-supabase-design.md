# Hidden Karate Dojo React + Supabase Design

Date: 2026-04-02

## Goal

Migrate the current Next.js server-first app to a client-only React app hosted as static assets.
Supabase becomes the full backend surface:

- Supabase Auth for sign-in
- Supabase Postgres for app data
- Row Level Security for normal reads and writes
- Edge Functions only for operations that require elevated trust

There must be no app-owned server outside Supabase.

## Recommended Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- `@supabase/supabase-js`
- `pdf-lib` for client PDF generation where feasible

## Architecture

The frontend becomes a single-page React app. The browser talks directly to Supabase for:

- sign-in with email and password
- reading members, camps, sessions and attendance
- creating and updating members
- creating and updating camps
- creating and updating training sessions
- soft delete for members via `active = false`

The browser must never receive or use the Supabase service role key.

Sensitive operations move to Supabase Edge Functions:

- permanent member deletion
- protected audit log writes
- any future admin-only maintenance operations
- PDF generation only if client-side generation proves too limited

## Auth Model

Authentication uses Supabase email/password instead of magic links.

Client flow:

- login page calls `supabase.auth.signInWithPassword`
- auth state is stored by Supabase in the browser
- protected routes are enforced in React router using the current session

Coach accounts are provisioned through an admin setup path using Supabase admin APIs, not email OTP.

## Data Access

Normal CRUD moves to direct client access with RLS.

Rules:

- authenticated users can read and write normal dojo tables
- `members.active = false` remains the standard delete flow
- archived members are excluded from normal lists by default
- attendance percentages are still derived from full history

The current schema can stay largely intact, but policy ownership shifts from server code to RLS.

## Edge Functions

Only operations that cannot safely live in the browser should use Edge Functions.

Initial function set:

- `audit-log-write`
  - receives an authenticated request
  - validates session
  - writes trusted audit events

- `member-delete-permanent`
  - validates caller
  - deletes attendance relations and member record
  - writes an audit event

Optional later:

- `attendance-export-pdf`
  - generates a canonical PDF on the backend if client-side export becomes inconsistent

## UI Migration

The current visual language remains the source of truth:

- same sidebar
- same topbar
- same cards
- same table styling
- same modal patterns
- same export actions

The React SPA should preserve the current UI structure rather than redesign it.

## Simplifications From The Next.js Version

Removed:

- Next App Router
- server actions
- middleware-based session checks
- server-rendered data loading

Replaced with:

- React router or equivalent client route handling
- client-side session guards
- Supabase client queries
- Edge Functions only for privileged operations

## Security Model

Security is split by trust level:

- RLS protects direct table access from the browser
- Edge Functions protect privileged operations
- no service role key in frontend code

This means the app is still "client only" from the hosting perspective, but not "everything directly in the browser" for admin-grade operations.

## Exports

CSV export should happen client-side in v1 of the React SPA.

PDF export should start client-side if the current output remains acceptable. If formatting or stability becomes a problem, move only PDF generation to an Edge Function.

## Migration Plan Shape

The migration should happen in four implementation stages:

1. Replace Next app shell with Vite React shell
2. Rebuild auth and routing client-side
3. Move member, camp, training and attendance views to direct Supabase client access
4. Add Edge Functions for permanent delete and audit logging

## Non-Goals

This migration does not aim to:

- redesign the UI
- add multi-role access control
- remove Supabase
- move all business logic into SQL RPCs

## Success Criteria

The migration is successful when:

- the app runs as static React without Next.js
- login works with email/password
- normal CRUD works directly against Supabase with RLS
- permanent delete and audit log are handled through Edge Functions
- the current dashboard UI is preserved closely
