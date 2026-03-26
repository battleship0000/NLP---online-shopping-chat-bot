# Admission Enquiry & Counselling System

A web application for managing college admission enquiries, built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Overview

This system enables:
- **Students** to submit admission enquiries for specific programs
- **Counsellors** to receive auto-assigned enquiries and manage their status
- **Admins** to manage programs and counsellors securely

### Key Features
- Auto-assignment of enquiries to the least-loaded online counsellor for the requested program
- Queue-based fallback when no counsellors are online
- Real-time dashboard updates via Supabase Realtime
- Role-based routing (student / counsellor / admin)
- Secure counsellor creation via Edge Function (no `auth.admin.*` on client)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend / Auth | Supabase (Auth, Database, Edge Functions) |

---

## Prerequisites

- Node.js 18+
- npm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local dev / migrations)
- A Supabase project

---

## Setup & Install

### 1. Clone and install dependencies

```bash
git clone https://github.com/battleship0000/NLP---online-shopping-chat-bot.git
cd NLP---online-shopping-chat-bot
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase dashboard → Settings → API.

### 3. Run Supabase migrations

If using Supabase CLI with a linked project:

```bash
supabase db push
```

Or run the migration SQL manually in the Supabase SQL editor:
- Open `supabase/migrations/20240101000000_initial.sql`
- Paste into the SQL editor and execute

### 4. Deploy Edge Functions

```bash
supabase functions deploy assign-enquiry
supabase functions deploy process-queue
supabase functions deploy create-counsellor
```

### 5. Seed an admin user

In the Supabase dashboard → Authentication → Users, create a user manually, then run in the SQL editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
```

---

## Run & Build

```bash
# Development server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Supabase Feature Scope

This app uses only:
- **Auth** – user sign-in/sign-out, session management
- **Database** – `profiles`, `programs`, `enquiries`, `counsellor_programs` tables with RLS
- **Edge Functions** – `assign-enquiry`, `process-queue`, `create-counsellor`

No Storage integration is used.

---

## Quick Smoke Test Plan

### 1. Student flow
1. Open `/` (home page)
2. Fill in the enquiry form (name, email, phone, program, optional message)
3. Submit → see success confirmation
4. ✅ Verify row appears in `enquiries` table in Supabase dashboard

### 2. Counsellor flow
1. Ensure a counsellor user exists and is assigned to at least one program in `counsellor_programs`
2. Log in at `/login` as the counsellor
3. ✅ Verify `profiles.is_online` is set to `true`
4. ✅ Verify queued enquiries for the counsellor's programs are assigned
5. Open `/counsellor` – see assigned enquiries
6. Update an enquiry status to "In Progress" → verify in dashboard
7. Log out → ✅ verify `profiles.is_online` is set to `false`

### 3. Admin flow
1. Log in as admin
2. Open `/admin` → Programs tab → add a new program
3. ✅ Verify program appears in the list and in the Student form dropdown
4. Switch to Counsellors tab → add a counsellor (form calls `create-counsellor` edge function)
5. ✅ Verify new user appears in Supabase Auth and counsellors list

### 4. Assignment logic
1. Log out all counsellors (all offline)
2. Submit an enquiry → status should remain `queued`
3. Log in as counsellor → `process-queue` runs → enquiry gets assigned
4. ✅ Verify in counsellor dashboard and in database

---

## Security Notes

- `supabase.auth.admin.*` is **never** called from client-side code
- Counsellor creation uses the `create-counsellor` Edge Function with service role key (server-side only)
- The edge function verifies the caller is an admin before creating any user
- All database tables have Row Level Security (RLS) enabled

---

## Supabase Database Schema

```
profiles         – extends auth.users; stores role, full_name, is_online
programs         – admission programs (name, description)
counsellor_programs – many-to-many: counsellors ↔ programs
enquiries        – student enquiries with status and assignment
```

---

## Follow-up Recommendations

- Add real-time notifications (Supabase Realtime broadcast) for counsellor dashboards
- Add email notifications via Supabase Edge Function + Resend/SendGrid
- Implement `counsellor_programs` management UI (assign counsellors to programs)
- Add pagination/search to admin enquiry list
- Add unit tests with Vitest + React Testing Library
- Complete migration to Deno v2 edge function syntax when Supabase upgrades