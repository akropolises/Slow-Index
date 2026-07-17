# Contributing

Slow Index is currently a dependency-free static prototype. Keep changes small and easy to review.

## Setup

1. Install Node.js 20 or later.
2. Start the local server.

```powershell
npm start
```

3. Open `http://127.0.0.1:8000/`.

## Google Calendar setup

Do not commit personal OAuth values.

1. Copy `config.example.js` to `config.local.js`.
2. Put your Google OAuth Client ID in `config.local.js`.
3. Register the exact origin you use in Google Cloud.

Common origins:

```text
http://localhost:8000
http://127.0.0.1:8000
```

If the dev server uses another port, register that origin too.

## Branches

- `main`: working shared baseline.
- `feature/<short-name>`: feature work.
- `fix/<short-name>`: bug fixes.
- `docs/<short-name>`: documentation-only changes.

Create one branch per topic. Avoid mixing UI changes, Google Calendar changes, and concept-document edits in the same branch unless they are tightly connected.

## Before opening a pull request

Run:

```powershell
npm run check
```

Then manually verify the path you touched:

- Demo onboarding
- Calendar source switching
- Manual event add
- Micro Slow start and finish
- Google Calendar load, when changing calendar code
- Mobile-width layout, when changing HTML or CSS

## Review checklist

- No personal values in committed files.
- Japanese text renders correctly as UTF-8.
- `micro-slows.js` remains the source of truth for runtime Micro Slow data.
- `micro-slows.md` is updated when Micro Slow content changes.
- Google Calendar scope stays read-only unless the team explicitly agrees otherwise.
- User-facing changes are checked on desktop and narrow mobile width.

## Commit style

Use short imperative messages:

```text
Add local Google config override
Fix manual event sorting
Document Google Calendar setup
```

## Git note

If `git status` reports `not a git repository`, initialize or reclone the repository before collaboration:

```powershell
git init
git add .
git commit -m "Initial Slow Index prototype"
```

Only run this once for a new repository. If the team already has a remote repository, clone that remote instead.
