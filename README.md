# North Legends FC — Team Website

The official website for **North Legends FC**, a U11/U12 youth soccer club based in the Dallas–Fort Worth area. Built so parents can check the schedule and gallery, and coaches can manage content without touching code.

Live at: **[northlegensfc.com](https://northlegensfc.com)** (custom domain pending) / [legends-pitch.vercel.app](https://legends-pitch.vercel.app)

---

## Documentation

| Document | What's in it |
|---|---|
| **README.md** ← you are here | Setup, stack, env vars, deployment |
| [TECHNICAL.md](TECHNICAL.md) | Architecture diagrams, auth flow, API routes, security, key files |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute — from opening an issue to submitting a PR |
| [SOURCES.md](SOURCES.md) | All external URLs: GotSport, SportsYou, Sanity, Vercel, R2, Upstash |
| [COACH_ONBOARDING.md](COACH_ONBOARDING.md) | Information needed from the coach before launch |

---

## What it does

**For parents:**
- Game schedule with live weather forecasts and Google Maps links
- Photo gallery organized by event, synced from Google Drive
- Match videos (KickReel) — full-quality 360° clips, goals, and in-game analytics
- Calendar subscription (Apple Calendar / Google Calendar / .ics)
- News and announcements from the coaching staff
- English and Spanish — full bilingual support

**For coaches:**
- Sanity Studio at `/studio` — manage roster, schedule, news, and gallery without code
- Admin panel at `/admin` — project tracker, links to Studio

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| CMS | Sanity.io (embedded Studio, GROQ) |
| Hosting | Vercel (ISR, Edge Middleware) |
| Video storage | Cloudflare R2 |
| Rate limiting | Upstash Redis (@upstash/ratelimit) |
| i18n | next-intl (EN / ES) |
| Weather | Open-Meteo (no API key) |
| Schedule feed | SportsYou webcal (polled hourly) |

---

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your values — see Environment Variables below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will build but protected routes (videos, gallery) won't work without valid env vars.

---

## Environment Variables

Create `.env.local` with the following. See `.env.example` for the template.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID (found in sanity.io dashboard) |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset — usually `production` |
| `SANITY_WRITE_TOKEN` | Yes | Sanity write-scoped API token (for feedback, clip-save, onboarding) |
| `FAMILY_PASSCODE` | Yes | Passcode families enter to unlock /videos, /gallery, /highlights |
| `ADMIN_PASSWORD` | Yes | Coach password for the /admin panel |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL — enables rate limiting on API routes |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token — required if URL is set |
| `GITHUB_ISSUES_TOKEN` | No | GitHub fine-grained token — creates GitHub issues from roadmap feedback form |
| `ONBOARDING_ENABLED` | No | Set to `true` to enable the `/api/onboarding` route (disabled by default) |

Rate limiting and GitHub issue creation degrade gracefully — the app works without those vars; those features just won't activate.

---

## Project Structure

```
legends-pitch/
├── app/
│   ├── page.tsx                   # Home: hero carousel, countdown, sponsors
│   ├── schedule/page.tsx          # Fixtures with weather + maps
│   ├── roster/page.tsx            # Player cards — field and list view
│   ├── gallery/page.tsx           # Photo gallery (album cards + lightbox)
│   ├── gallery/[eventId]/page.tsx # Single album
│   ├── highlights/page.tsx        # YouTube highlights
│   ├── videos/page.tsx            # KickReel session list
│   ├── videos/[sessionId]/        # Session viewer: player, clips, analytics
│   ├── news/page.tsx              # Announcements list
│   ├── news/[slug]/page.tsx       # Single post
│   ├── contact/page.tsx           # Coach info, map
│   ├── roadmap/page.tsx           # Roadmap + public feedback form
│   ├── family/page.tsx            # Family passcode gate
│   ├── admin/                     # Coach admin panel (password protected)
│   ├── onboarding/page.tsx        # Coach onboarding form (gated via env var)
│   ├── studio/[[...tool]]/        # Embedded Sanity Studio
│   └── api/                       # API routes (see TECHNICAL.md)
│
├── components/                    # Shared UI
│   ├── Nav.tsx                    # Top nav + hamburger (handedness toggle)
│   ├── HeroCarousel.tsx           # Home hero slides
│   ├── FieldHeatmap.tsx           # Match analytics heatmap
│   ├── ActivityTimeline.tsx       # Per-half clip timeline
│   └── ...
│
├── lib/
│   ├── sanity/                    # Sanity client, image helpers, GROQ queries
│   ├── ratelimit.ts               # Rate limiter (Upstash, graceful degradation)
│   ├── family-auth.ts             # Family cookie helpers
│   ├── admin-auth.ts              # Admin cookie helpers
│   ├── data/tracker.ts            # Dev session + cost tracker data
│   └── types.ts                   # Shared TypeScript types
│
├── schemaTypes/                   # Sanity content schemas
├── middleware.ts                  # Route guards (family + admin gates)
├── i18n/                          # next-intl config + routing
└── public/                        # Logo, OG image, static assets
```

---

## Deployment

The project deploys automatically to Vercel on every push to `main`.

To set up your own deployment:
1. Fork this repo and import it at [vercel.com/new](https://vercel.com/new)
2. Add all required environment variables in the Vercel dashboard (Settings → Environment Variables)
3. Vercel auto-detects Next.js — click Deploy

For Sanity Studio to work in production, add your Vercel deployment URL to the CORS origins in your Sanity project settings.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — all skill levels welcome, from opening an issue to submitting a PR.
