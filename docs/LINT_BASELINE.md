# ESLint baseline (Task 1.7)

ESLint (flat config, `eslint-plugin-react` + `eslint-plugin-react-hooks`) was
wired up in Task 1 per BLUEPRINT.md §14 1.7. Per that task's own test
criteria ("lint passes or has a recorded baseline"), the pre-existing
findings below are recorded as a starting baseline rather than fixed here —
fixing them would mean editing files well outside Task 1's scope, and most
are already tracked as later work in the Technical Debt Register (§12) or
the phase plan (§14).

Run `npm run lint` to reproduce. As of Task 1:

- **24 errors, 5 warnings**, all in `src/pages/{Dashboard,IntakeForm,Login,Preferences}.jsx`.
- Categories:
  - `react-hooks/set-state-in-effect` (Dashboard.jsx) — setState called
    synchronously inside effects. Related to TD-06 (Dashboard monolith,
    fixed in Task 9's decomposition) and the sync-on-select coupling
    called out there.
  - `react/no-unescaped-entities` — literal apostrophes in JSX text across
    several pages. Cosmetic; safe to fix opportunistically whenever a file
    is touched for its own task.
  - `react-hooks/exhaustive-deps` (warnings) — a few effects with
    intentionally partial dependency arrays.
  - `no-unused-vars` (Preferences.jsx) — two unused destructured params.

None of these represent new regressions from Task 1 or Task 2; they were
present in the code before this pass and are simply visible now that lint
is running for the first time. Do not silently fix them inside unrelated
tasks — address each within its own scoped task so the diff stays
traceable, per the general contract in §16.
