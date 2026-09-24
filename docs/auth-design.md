# Auth design decisions

This is a short note on how authentication works in Life Tracker and why I built it this way. I'm writing this down now, while the reasoning is fresh, instead of trying to reconstruct it later from memory.

## Token storage

There are two tokens: a short-lived access token and a longer-lived refresh token. They are stored differently on purpose.

**Access token: in memory only (a Zustand store), never localStorage or sessionStorage.** Any token stored in `localStorage` or `sessionStorage` is readable by any JavaScript running on the page — including injected script from an XSS vulnerability. Keeping the access token in memory means a successful XSS attack still can't read it. The cost is that it disappears on every full page reload, which is why the app needs a silent-refresh step (below) to restore a session without asking the user to log in again.

**Refresh token: an httpOnly cookie, never touched by JavaScript at all.** `httpOnly` means client-side JavaScript cannot read the cookie even if it tried — the browser attaches it to requests automatically, but `document.cookie` never sees it. This is a stronger guarantee than "we chose not to read it"; the browser enforces it. The refresh token is also signed with a separate secret from the access token, so leaking one doesn't help an attacker forge the other.

**Why not just one long-lived token stored in localStorage?** That's simpler to build, but it means a single XSS bug anywhere in the app hands over long-lived access, with the token in a compromised state until it expires (which is expensive to make short, without also making the user log in constantly). Splitting it into "short-lived and in memory" plus "long-lived and unreadable by JS" gets most of the security of a fully server-side session, without needing a server-side session store.

## Refresh strategy

- Access token: 15 minutes.
- Refresh token: 30 days.
- On app load, the frontend calls `/api/auth/refresh` once, silently, using whatever refresh cookie the browser has. If it succeeds, the user is logged back in without re-entering credentials. If it fails (no cookie, expired, or the user was deleted), they land on the login page — no error shown, since "you're not logged in" isn't a failure state worth alarming a first-time visitor with.
- Every protected route waits for that silent-refresh check to resolve before deciding whether to redirect to `/login`. Skipping this wait was an actual bug I hit and fixed: without it, a page reload on a protected route could redirect to login *before* the refresh check had a chance to prove the session was still valid.

## Cookie attributes: `SameSite` and `Secure`

These differ between local development and production, and the difference matters more than it looks:

| | Local dev | Production |
|---|---|---|
| `Secure` | `false` | `true` |
| `SameSite` | `Lax` | `None` |

Locally, frontend and backend are both `localhost` (different ports, but browsers treat that as same-site for cookie purposes), so `Lax` works fine. In production, the frontend (Vercel) and backend (Render) are genuinely different domains, which requires `SameSite=None; Secure` for the cookie to be sent cross-site at all.

Getting the attributes right wasn't the end of the story. Even with `SameSite=None; Secure` set correctly, the first production deploy hit real cross-domain session failures — the browser's *third-party cookie blocking* (a stricter, separate policy from `SameSite`, on by default in current Chrome, Safari, and Firefox) refused to send the cookie at all, since it belonged to a different domain than the page. The fix wasn't a cookie attribute at all: it was routing browser API requests through a Vercel rewrite proxy, so the browser only ever talks to one origin and the cookie becomes first-party again. `SameSite=None; Secure` is necessary but, for this specific hosting shape (frontend and backend on different providers), not sufficient on its own.

## Other decisions worth naming

- **Generic "Invalid credentials" for both a wrong password and a nonexistent email**, on both signup and login. Distinguishing them lets an attacker enumerate which emails have accounts; a slightly worse error message is a small price for closing that off.
- **Password hashing (bcrypt, cost factor 12) is deliberately slow.** On the free-tier hosting this project runs on, that shows up as a real, noticeable 2-4 second delay on login. I added a loading state (disabled button, spinner) to communicate that clearly, rather than lowering the cost factor to make it feel faster — that trade would weaken the actual security property for a cosmetic win.
- **Rate limiting is scoped to `/signup` and `/login` only, not `/refresh` or `/logout`.** Signup and login are where credential-guessing actually happens; refresh fires automatically on every page load as part of the silent-refresh flow, so sharing a tight limit with it meant normal use could exhaust the budget just from routine navigation. A stolen valid refresh cookie is a different threat model that a request-rate limit doesn't meaningfully defend against anyway.
