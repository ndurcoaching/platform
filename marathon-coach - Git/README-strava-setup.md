# Strava integration — setup guide (Vercel)

This adds real, day-to-day Strava data to your platform: clients connect their
own Strava account from the portal, their runs flow in automatically via
webhook, and your dashboard shows actual-vs-planned mileage live instead of
waiting for a check-in. When you click "Build month," last week's real
compliance also nudges next month's mileage progression — no AI calls, just
arithmetic against data you already have.

## What's in this drop

```
vercel.json                          ← SPA fallback so #/coach etc. don't 404
api/
  strava-connect.js                  ← starts the OAuth flow for one client
  strava-callback.js                 ← Strava redirects here, tokens get saved
  strava-webhook.js                  ← receives activity events, pulls the data
  strava-status.js                   ← lets the portal check "connected?" safely
supabase-strava-migration.sql        ← run once in Supabase SQL Editor
src/lib/strava.js                    ← adherence math + connect URL helper
src/pages/ClientPortal.jsx           ← adds "Connect Strava" banner/badge
src/pages/Dashboard.jsx              ← adds the live "this week" card + auto-adjust
```

Drop `vercel.json` at the repo root. The `api/` folder goes at the repo root
too (not inside `src/`). Replace the existing `ClientPortal.jsx` and
`Dashboard.jsx` — diff first if you've made local changes since cloning.

You can delete `netlify.toml.txt` — Vercel auto-detects Vite projects.

---

## Step 1 — Register a Strava API application

1. Go to strava.com/settings/api and create an app (one app, shared across all clients).
2. Authorization Callback Domain: just the domain, no https:// and no path
   e.g. your-project.vercel.app
3. Copy your Client ID and Client Secret.

## Step 2 — Add environment variables in Vercel

Vercel dashboard → your project → Settings → Environment Variables → add:

| Key | Value |
|---|---|
| `STRAVA_CLIENT_ID` | from step 1 |
| `STRAVA_CLIENT_SECRET` | from step 1 |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | any random string you make up — reused in step 4 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key (not the anon key — never put this in a VITE_ prefixed var or it ends up in the browser bundle) |
| `SITE_URL` | your deployed URL e.g. https://your-project.vercel.app (no trailing slash) |

VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are already set from your
original setup — the functions reuse them.

## Step 3 — Run the database migration

Supabase → SQL Editor → paste the contents of supabase-strava-migration.sql → Run.

## Step 4 — Deploy, then register the webhook (one-time)

Deploy first (push to main or `vercel --prod`), then from your terminal:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_STRAVA_CLIENT_ID \
  -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
  -F callback_url=https://your-project.vercel.app/api/strava-webhook \
  -F verify_token=THE_SAME_STRING_YOU_PUT_IN_STRAVA_WEBHOOK_VERIFY_TOKEN
```

Strava immediately hits your endpoint with a GET to verify it — if your
function responds, you get back a subscription id. Done; never needed again
unless you delete the subscription.

To confirm it's active:
  curl -G https://www.strava.com/api/v3/push_subscriptions -d client_id=... -d client_secret=...

## Step 5 — Local development

```bash
npm i -g vercel   # if you haven't already
vercel dev        # replaces npm run dev — runs Vite + API routes together
```

vercel dev proxies /api/* to your local functions exactly as production does.
npm run dev alone won't run the functions, so OAuth redirects will fail locally.

## Step 6 — Try it

1. Open the portal as a test client and click Connect Strava.
2. Authorize on Strava's screen — you'll land back on the portal with a
   "Strava connected" banner.
3. Record or upload a run on Strava.
4. Within seconds it should appear in the coach dashboard's
   "This week (live from Strava)" card for that client.

---

## How the plan adjustment works

When you click Build month, the dashboard computes the client's compliance
for the most recently completed Mon–Sun week (actual Strava miles / planned
miles from the saved plan). Below 85%, it scales back weeklyIncreaseRate and
minWeeklyIncreaseMiles before calling buildMonthPlan — under 60% holds mileage
flat, 60–85% halves the usual bump, 85%+ leaves your configured rate untouched.
Nothing in planBuilder.js itself changed.

## Notes

- Only type/sport_type === "Run" activities are stored. Remove that check in
  api/strava-webhook.js if you ever want rides or swims too.
- Tokens never reach the browser. The portal only ever asks strava-status.js
  a yes/no question.
- Strava webhooks push new activities going forward, not retroactively, so
  adherence numbers start from whenever a client first connects.
- If you had a previous Netlify webhook subscription registered, delete it
  first:
  curl -X DELETE https://www.strava.com/api/v3/push_subscriptions/{id} \
    -F client_id=... -F client_secret=...
