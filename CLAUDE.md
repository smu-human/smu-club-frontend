# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

There is no test suite configured.

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (defaults to `/api/v1`) |
| `VITE_THUMBNAIL_BASE_URL` | S3/CDN base URL for club thumbnail images |
| `VITE_S3_BASE_URL` | Fallback S3 base URL for images |

## Architecture

**Stack:** React 19, React Router v7, Vite. No state management library — all state is local `useState`/`useEffect`.

**Entry point:** `src/main.jsx` sets up a global session-expired listener (dispatches a custom DOM event when the JWT expires) then renders `<RouterProvider>`.

**Routing:** `src/app/router.jsx` — flat `createBrowserRouter` config. Routes are split by role:
- `/`, `/login`, `/signup`, `/club/:id` — public
- `/mypage`, `/account_edit`, `/apply_form_submit`, `/apply_form_change/:id` — member
- `/club_edit`, `/club_manage/:clubId`, `/applicant_manage/:clubId`, `/apply_form_edit/:id`, `/apply_form/:clubId/:clubMemberId` — owner (club admin)

**API layer:** `src/lib/api.js` — single file containing all backend calls. Key functions:
- `apiFetch` — raw fetch wrapper; automatically retries once after reissuing a JWT via `/public/auth/reissue` on 401/`EXPIRED_TOKEN`. Uses a shared `reissue_promise` to coalesce concurrent refresh attempts.
- `apiJson` — wraps `apiFetch`, parses JSON, throws on `status === "FAIL"`.
- Auth tokens are stored in `localStorage` under `smu_access_token` / `smu_refresh_token`. `LOGIN_FAILED` errors are explicitly excluded from the session-expiry flow.
- Functions are namespaced by role: `fetch_public_*`, `fetch_member_*` / `update_mypage_*`, `fetch_owner_*` / `owner_*`.

**Styling:** Each page has a co-located `<page>.css` file. `src/styles/globals.css` defines shared layout primitives (`.page-header`, `.app-shell`, `.app-frame`, `.back-btn`, `.page-footer`). The design targets a 390px mobile-first layout with desktop breakpoints at 1024px and 1079px.

**Image uploads (owner):** Owner pages use a presigned S3 URL flow — `owner_issue_upload_urls` → `owner_put_presigned_url` (direct PUT to S3) → submit `uploadedImageFileNames` in the club payload.

**No-op patterns to be aware of:**
- `unused-vars` ESLint rule ignores names matching `/^[A-Z_]/` (uppercase constants and `_`-prefixed).
- Several commented-out features exist in the codebase (D-day labels, members count) — these fields are present in component state but not yet populated from the API.
