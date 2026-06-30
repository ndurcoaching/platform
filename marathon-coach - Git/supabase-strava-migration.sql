-- ============================================
-- STRAVA INTEGRATION — run this in Supabase SQL Editor
-- (after your existing supabase-setup.sql has already been run)
-- ============================================

-- 1. STRAVA CONNECTIONS
-- One row per client who has linked their Strava account.
-- Tokens live here ONLY — never sent to the browser. The Netlify
-- functions read/write this table using the service role key, which
-- bypasses RLS entirely, which is why there is no insert/update policy
-- below: the anon (public) key used by the frontend has zero access,
-- by design.
create table if not exists strava_connections (
  client_id uuid primary key references clients(id) on delete cascade,
  strava_athlete_id bigint unique not null,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null, -- unix timestamp (seconds), as returned by Strava
  connected_at timestamp with time zone default now()
);

alter table strava_connections enable row level security;

-- Coaches can see who's connected (used for a "connected" badge in the dashboard).
-- No select/insert/update policy is granted to anyone else.
create policy "Coaches can read strava connections"
  on strava_connections for select
  using (auth.uid() in (select user_id from coaches));

-- 2. STRAVA ACTIVITIES
-- One row per Strava activity, pushed in near-real-time by the webhook.
create table if not exists strava_activities (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  strava_activity_id bigint unique not null,
  activity_date date not null,
  distance_miles numeric not null,
  moving_time_sec integer,
  activity_type text,
  name text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_strava_activities_client_date
  on strava_activities (client_id, activity_date);

alter table strava_activities enable row level security;

create policy "Coaches can read all activities"
  on strava_activities for select
  using (auth.uid() in (select user_id from coaches));

-- Optional, for later: lets a logged-in client see their own runs in the portal.
-- Safe to leave in even if you don't build that UI yet — it only exposes
-- distance/date/type/name, never tokens.
create policy "Clients can view own activities"
  on strava_activities for select
  using (
    client_id in (
      select id from clients where lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ============================================
-- DONE. Next steps:
-- 1. Add SUPABASE_SERVICE_ROLE_KEY, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET,
--    STRAVA_WEBHOOK_VERIFY_TOKEN, and SITE_URL as Netlify environment variables
--    (see README-strava-setup.md).
-- 2. Deploy, then register your one-time Strava webhook subscription
--    (also in README-strava-setup.md).
-- ============================================
