# Contributing

Slow Index is a small static-first prototype with an optional local Web Push server. Keep changes small, easy to review, and aligned with the existing plain HTML/CSS/JavaScript structure.

## Setup

Install Node.js 20 or later.

For basic app development:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:8000/
```

For Web Push development:

```powershell
npm install
npx web-push generate-vapid-keys
$env:VAPID_PUBLIC_KEY="YOUR_VAPID_PUBLIC_KEY"
$env:VAPID_PRIVATE_KEY="YOUR_VAPID_PRIVATE_KEY"
$env:VAPID_SUBJECT="mailto:your-email@example.com"
npm run start:push
```

Put only the public key in `config.local.js`.

```js
window.SLOW_INDEX_CONFIG.pushPublicKey = "YOUR_VAPID_PUBLIC_KEY";
```

## Local Config

Do not commit personal OAuth values or VAPID private keys.

Copy the example config:

```powershell
Copy-Item config.example.js config.local.js
```

Use `config.local.js` for:

- Google OAuth Client ID
- Google Calendar ID, if not `primary`
- VAPID Public Key

## Branches

- `main`: shared stable baseline
- `feature/<short-name>`: feature work
- `fix/<short-name>`: bug fixes
- `docs/<short-name>`: documentation-only changes

Create one branch per topic. Avoid mixing UI changes, Google Calendar changes, Push changes, and concept-document edits unless they are tightly connected.

## Before Opening a Pull Request

Run:

```powershell
npm run check
```

Then manually verify the path you touched:

- Demo onboarding
- Calendar source switching
- Manual event add
- Micro Slow start and finish
- Automatic start at the scheduled Micro Slow time
- Notification permission and test notification, when changing notification code
- Web Push reminder from `npm run start:push`, when changing Push code
- Google Calendar load, when changing calendar code
- Mobile-width layout, when changing HTML or CSS

## Review Checklist

- No personal values in committed files.
- No VAPID private key in client-side files.
- Japanese text renders correctly as UTF-8.
- `micro-slows.js` remains the source of truth for runtime Micro Slow data.
- `micro-slows.md` is updated when Micro Slow content changes.
- Google Calendar scope stays read-only unless the team explicitly agrees otherwise.
- Push behavior is clear for both app-open and app-closed cases.
- User-facing changes are checked on desktop and narrow mobile width.

## Commit Style

Use short imperative messages:

```text
Add local Google config override
Fix manual event sorting
Document Web Push setup
```
