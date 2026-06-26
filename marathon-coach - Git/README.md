# Marathon Coach App

A secure athlete intake form + coach dashboard with AI-powered training plan generation.

---

## How it works

| URL | Who sees it | What it does |
|-----|-------------|--------------|
| `yoursite.com/` | Clients | Intake form — submits to your database |
| `yoursite.com/#/portal` | Clients | Training portal — clients sign up/log in and view their plan once you've saved it. Shows "your coach is still working on it" until then. |
| `yoursite.com/#/coach` | You only | Dashboard — view clients, generate plans |

---

## Setup (takes ~20 minutes)

### Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New project**, name it "marathon-coach"
3. Choose a strong database password and save it
4. Wait ~2 minutes for the project to spin up

### Step 2 — Create your coach account

1. Go to **Authentication → Users** in Supabase
2. Click **Add user → Create new user**
3. Enter your email and a strong password
4. This is what you'll use to log into the dashboard

### Step 3 — Create the database table

1. In your Supabase project, go to **SQL Editor → New query**
2. Paste the entire contents of `supabase-setup.sql`
3. Before running it, find the line near the bottom that says `'YOUR_COACH_EMAIL_HERE'` and replace it with the email you created in Step 2
4. Click **Run** — you should see "Success"
5. Go to **Authentication → Providers → Email** and confirm **Confirm email** is turned ON. This makes sure a client has to prove they own an email address before they can sign up with it.

### Step 4 — Get your API keys

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 5 — Configure the app

1. Copy `.env.example` and rename it to `.env`
2. Fill in your values:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

To get your Anthropic API key: [console.anthropic.com](https://console.anthropic.com) → API Keys

### Step 6 — Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — you should see the intake form.
Open `http://localhost:5173/#/coach` — you'll see the login screen.

### Step 7 — Deploy to Netlify (free)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **Add new site → Deploy manually**
3. Run `npm run build` — this creates a `dist/` folder
4. Drag the `dist/` folder onto Netlify
5. Go to **Site settings → Environment variables** and add your 3 env vars
6. Trigger a redeploy — done!

Your intake form URL: `https://your-site-name.netlify.app`
Your dashboard URL: `https://your-site-name.netlify.app/#/coach`

---

## Security model

- **Clients can only INSERT** (submit a form). They cannot read, update, or delete anything — including other clients' data. This is enforced at the database level by Supabase Row Level Security (RLS), not just in the frontend code.
- **Only authenticated coaches** (you) can read or update client records.
- **HTTPS** is enforced automatically by Netlify.
- **Passwords** are hashed and managed by Supabase Auth — you never touch them.

---

## Sharing with clients

Just send them your Netlify URL: `https://your-site-name.netlify.app`

That's the intake form. The dashboard at `/#/coach` is separate and login-protected.

---

## File structure

```
marathon-coach/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          ← copy to .env and fill in your keys
├── supabase-setup.sql    ← run this once in Supabase SQL editor
└── src/
    ├── main.jsx
    ├── App.jsx            ← routing logic
    ├── index.css          ← global styles
    ├── supabase.js        ← Supabase client
    └── pages/
        ├── IntakeForm.jsx ← public client form
        ├── Login.jsx      ← coach login
        └── Dashboard.jsx  ← coach dashboard + AI plan generation
```
