Task 1: repo restructure & hygiene

- Move all files from 'marathon-coach - Git/' to repo root
- Rename package.json name: marathon-coach -> ndur
- Delete dead Netlify layer: netlify/ (generate-plan.js), netlify.toml.txt
- Add .gitignore (node_modules, dist, .env*, .vercel, coverage)
- Add .env.example (names only, derived from actual code references,
  no VITE_ANTHROPIC_API_KEY since it's unused dead-feature cruft)
- Add docs/BLUEPRINT.md and docs/decisions/ per the architecture doc's
  own §3.1 folder convention
- Rewrite README.md: Vercel-only deploy path (no Netlify/AI-generation
  claims), no VITE_ANTHROPIC_API_KEY instruction, adds a Runbook section
  (coach allowlist procedure, Strava webhook registration, env vars)

Full-history secret scan (OQ-2) run as part of this task: no .env or
secret-named files ever committed; content/entropy scan across all 32
commits found no real secrets (only npm package-lock.json integrity
hashes, which are false positives, and process.env.* references to
env var *names*, never literal values). Nothing to rotate.

npm run build passes post-restructure.

NOTE: Vercel Root Directory setting must be updated to '/' (from
'marathon-coach - Git') in the same deploy as this merges, or the
site will 404 (per blueprint regression-risk note for Task 1).
