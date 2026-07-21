# Contributing

Micro Slow is now focused on the Electron desktop prototype. Keep changes small, easy to review, and aligned with the existing plain HTML/CSS/JavaScript renderer plus Electron main process structure.

## Setup

Install Node.js 20 or later.

```powershell
npm install
npm run electron
```

Electron changes usually involve:

- `electron-main.js`
- `electron-preload.js`
- the renderer contract in `app.js`
- `forge.config.js`, when changing packaged build behavior

## Local Config

Do not commit personal OAuth secrets.

Copy the example config:

```powershell
Copy-Item config.example.js config.local.js
```

Use `config.local.js` for:

- Google OAuth Client Secret, when required by the desktop OAuth client
- Google Calendar ID, if not `primary`

The shared Google OAuth Client ID lives in `config.js`.

## Branches

- `main`: shared stable baseline
- `feature/<short-name>`: feature work
- `fix/<short-name>`: bug fixes
- `docs/<short-name>`: documentation-only changes

Create one branch per topic. Avoid mixing UI changes, Google Calendar changes, desktop behavior, and concept-document edits unless they are tightly connected.

Android work should start from a separate Capacitor-focused branch, normally `feature/android-capacitor`. Keep it separate from Windows Electron packaging and desktop behavior changes because the Android version will replace Electron main/preload responsibilities with Capacitor-side auth, notification, storage, and background behavior.

## Before Opening a Pull Request

Run:

```powershell
npm run check
```

For Windows zip packaging:

```powershell
npm run make
```

For a local verification build that includes ignored `config.local.js` in the zip:

```powershell
npm run make:local
```

Use `npm run make:local` only for local verification builds that intentionally include the Google OAuth Client Secret. Do not publish, share, or upload build artifacts produced this way.

Then manually verify the path you touched:

- Google onboarding
- Calendar source switching
- Manual event add
- Manual event delete
- Per-event auto-start skip toggle
- Google Calendar load and refresh, when changing calendar code
- Automatic start at the scheduled Micro Slow time
- Fullscreen Micro Slow and minimize-after-finish behavior
- Electron window foreground behavior from `npm run electron`, when changing desktop code
- Mobile/narrow layout, when changing HTML or CSS

## Review Checklist

- No personal values in committed files.
- No Google OAuth Client Secret in Git.
- Secret-bearing local build artifacts are not published or shared.
- Japanese text renders correctly as UTF-8.
- `micro-slows.js` remains the source of truth for runtime Micro Slow data.
- `micro-slows.md` is updated when Micro Slow content changes.
- Google Calendar scope stays read-only unless the team explicitly agrees otherwise.
- Electron Google Calendar auth runs in the main process and stores tokens in Electron `userData`, not in the repo.
- User-facing changes are checked on desktop and narrow window width.

## Commit Style

Use short imperative messages:

```text
Add Electron foreground scheduler
Fix manual event sorting
Document desktop Google OAuth setup
```
