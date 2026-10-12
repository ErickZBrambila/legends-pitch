# External Data Sources — North Legends FC

Reference URLs for all external services, feeds, and dashboards the site depends on.
Keep this file updated when URLs change or new sources are added.

---

## Schedule & Results

### GotSport (official league)
The authoritative source for standings, game results, and referee assignments.

| Team | URL |
|---|---|
| U11 Schedule | https://system.gotsport.com/org_event/events/55587/schedules?team=4373770 |

Update standings and results in `lib/data/gotsport.ts` after each game.

### SportsYou (U11 live calendar)
iCal feed polled hourly — drives the U11 schedule page automatically.

| Resource | URL |
|---|---|
| U11 webcal feed | `webcal://calendar.sportsyou.com/access/us-c7ad2fa6-0942-4ade-a1e8-04b62f6d5c00/372731d1-045d-40b6-801e-960b35deccc6` |
| U11 Google Calendar subscribe | `https://calendar.sportsyou.com/access/us-c7ad2fa6-0942-4ade-a1e8-04b62f6d5c00/372731d1-045d-40b6-801e-960b35deccc6` |

Code: `lib/data/sportsyou.ts` — parses iCal, maps short UIDs to opponent names.
Opponent name mapping lives in `OPPONENT_NAMES` — add new entries when unknown opponents appear.

---

## Content Management

### Sanity CMS
All dynamic content: roster, news, gallery, video sessions, match metadata.

| Resource | URL |
|---|---|
| Sanity Studio (production) | https://legends-pitch.vercel.app/studio |
| Sanity dashboard | https://sanity.io/manage/personal/project/fg925bng |
| Project ID | `fg925bng` |
| Dataset | `production` |

---

## Infrastructure

### Vercel (hosting)
| Resource | URL |
|---|---|
| Vercel dashboard | https://vercel.com/erickzbrambilas-projects/legends-pitch |
| Production URL | https://legends-pitch.vercel.app |
| Custom domain (pending) | https://northlegensfc.com |

### Cloudflare R2 (video storage)
| Resource | Notes |
|---|---|
| Bucket | `legends-pitch` |
| Public URL | `https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev` |
| CDN domain (pending) | `videos.northlegensfc.com` — activate once domain is connected |

CDN requires connecting `northlegensfc.com` in Cloudflare first.
Once connected: add custom domain on the bucket → update `r2Url` fields in Sanity → update `ALLOWED_HOST` in `app/api/clip-download/route.ts`.

### Upstash Redis (rate limiting)
| Resource | URL |
|---|---|
| Console | https://console.upstash.com |
| Database | `legends-pitch` (US East) |

Env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel.

### GitHub (source + issue tracking)
| Resource | URL |
|---|---|
| Repository | https://github.com/ErickZBrambila/legends-pitch |
| Issues | https://github.com/ErickZBrambila/legends-pitch/issues |

Feedback form submissions automatically open GitHub issues when `GITHUB_ISSUES_TOKEN` is set.

---

## Weather

### Open-Meteo
Free weather API — no API key required.
Used on the schedule page to show forecasts per game location.
Docs: https://open-meteo.com/en/docs

---

## Media & Photos

### Benn's Google Drive (game photos)
Photos organized by `YYYY-MM-DD` subfolders. Ask Benn for sharing link.
Used as source for gallery uploads to Sanity.

### Google Drive (full-game footage)
Full 4K match recordings linked from the KickReel session viewer.
Each `videoSession` doc in Sanity has a `googleDriveUrl` field.

---

## Admin & Monitoring

| Resource | URL |
|---|---|
| Project Tracker (cost / sessions) | https://legends-pitch.vercel.app/admin/tracker |
| Vercel Analytics | https://vercel.com/erickzbrambilas-projects/legends-pitch/analytics |
| Vercel Logs | https://vercel.com/erickzbrambilas-projects/legends-pitch/logs |
