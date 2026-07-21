-- ============================================
-- MARATHON COACH APP — SUPABASE SETUP
-- Run this entire file in your Supabase SQL editor
-- (supabase.com → your project → SQL Editor → New query)
-- ============================================

-- 1. CLIENTS TABLE
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  email text not null,
  phone text,
  gender text,
  age integer,
  experience text,
  weekly_mileage integer,
  goal_race text,
  race_date date,
  training_plan text
);

-- 2. ROW LEVEL SECURITY (RLS)
-- This is the key security layer.
-- Clients can INSERT (submit the form) but cannot READ other clients.
-- Only authenticated coaches can read/update/delete.

alter table clients enable row level security;

-- Allow anyone to submit the intake form (insert only)
create policy "Public can submit intake form"
  on clients for insert
  with check (true);

-- Only authenticated users (coaches) can read all clients
create policy "Coaches can read clients"
  on clients for select
  using (auth.role() = 'authenticated');

-- Only authenticated users can update (add training plan)
create policy "Coaches can update clients"
  on clients for update
  using (auth.role() = 'authenticated');

-- Only authenticated users can delete clients
create policy "Coaches can delete clients"
  on clients for delete
  using (auth.role() = 'authenticated');

-- ============================================
-- DONE. Your database is ready.
-- Next: go to Authentication > Users in Supabase
-- and create your coach account (your email + password).
-- ============================================

-- ============================================
-- UPDATE: Add agreement tracking columns
-- Run this in Supabase SQL Editor if you already
-- ran the original setup script
-- ============================================
alter table clients
  add column if not exists agreed_to_terms boolean default false,
  add column if not exists agreed_at timestamp with time zone,
  add column if not exists agreement_version text;

-- ============================================
-- UPDATE: Coach preferences table
-- ============================================
create table if not exists coach_prefs (
  coach_id uuid primary key references auth.users(id),
  prefs jsonb not null default '{}',
  updated_at timestamp with time zone default now()
);

alter table coach_prefs enable row level security;

create policy "Coaches can manage their own prefs"
  on coach_prefs for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- ============================================
-- UPDATE: Detailed running history columns
-- ============================================
alter table clients
  add column if not exists years_running numeric,
  add column if not exists pr_5k text,
  add column if not exists pr_10k text,
  add column if not exists pr_half text,
  add column if not exists pr_full text,
  add column if not exists past_injuries text,
  add column if not exists typical_weekly_structure text;

-- ============================================
-- UPDATE: Race distance column
-- ============================================
alter table clients
  add column if not exists race_type text default 'full';

-- ============================================
-- UPDATE: Client portal support
-- Run this once you add client login/signup.
--
-- IMPORTANT: clients now get real Supabase Auth accounts
-- (they sign up at yoursite.com/#/portal). That means the
-- old "Coaches can read clients" policy below — which only
-- checked `auth.role() = 'authenticated'` — would let ANY
-- logged-in client read every other client's row, not just
-- their own. This block fixes that by introducing an
-- explicit "coaches" allowlist and tightening those policies.
-- ============================================

-- 1. Allowlist of coach accounts. Locked down by default —
--    only editable from the SQL editor (no public policies),
--    same as how you create your own coach login today.
create table if not exists coaches (
  user_id uuid primary key references auth.users(id)
);
alter table coaches enable row level security;

-- Add yourself as a coach (run once per coach account).
-- Replace with your actual coach email — the one you use
-- to log into yoursite.com/#/coach.
insert into coaches (user_id)
select id from auth.users where email = 'YOUR_COACH_EMAIL_HERE'
on conflict do nothing;

-- 2. Re-point the coach policies at the allowlist instead of
--    "any authenticated user."
drop policy if exists "Coaches can read clients" on clients;
create policy "Coaches can read clients"
  on clients for select
  using (auth.uid() in (select user_id from coaches));

drop policy if exists "Coaches can update clients" on clients;
create policy "Coaches can update clients"
  on clients for update
  using (auth.uid() in (select user_id from coaches));

drop policy if exists "Coaches can delete clients" on clients;
create policy "Coaches can delete clients"
  on clients for delete
  using (auth.uid() in (select user_id from coaches));

-- 3. Let a logged-in client read ONLY their own row, matched
--    by the email on their auth account. This is a separate,
--    additive policy — it doesn't grant access to anyone else's row.
create policy "Clients can view own record"
  on clients for select
  using (lower(auth.jwt() ->> 'email') = lower(email));

-- ============================================
-- DONE. Next: in Supabase, go to Authentication > Providers >
-- Email and confirm "Confirm email" is ON, so a client must
-- prove they own an email address before they can sign up
-- with it.
-- ============================================
