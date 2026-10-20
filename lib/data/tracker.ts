export interface WorkSession {
  date: string;
  title: string;
  hours: number;
  commits: number;
  features: string[];
  claudeCostUSD: number; // estimated from Anthropic billing for this project
}

export interface KickReelRun {
  date: string;
  label: string;
  team: "U11" | "U12" | "Both";
  type: "Game" | "Practice" | "Tournament";
  clipsExtracted: number;
  uploadedToR2: boolean;
  publishedToSanity: boolean;
  notes?: string;
}

export interface ServiceLine {
  name: string;
  purpose: string;
  plan: string;
  monthlyCostUSD: number;
  annualCostUSD: number;
  notes: string;
}

export const SESSIONS: WorkSession[] = [
  {
    date: "2026-10-19",
    title: "Session 18 — Admin Media Manager (Photos & Videos)",
    hours: 1.5,
    commits: 1,
    claudeCostUSD: 8.94,
    features: [
      "New /admin/media page — coaches can manage photos and videos without touching Sanity Studio",
      "Photos tab — multi-file drop zone uploads to Sanity assets and groups them into galleryEvent albums; albums appear live on /gallery",
      "Videos tab — YouTube URL or direct MP4/MOV/WebM upload (up to 500 MB) to Cloudflare R2; appears on /videos Collections section",
      "R2 video upload API — POST /api/admin/upload-video streams files to kickreel-videos bucket under highlights/ prefix",
      "Gallery API — POST/DELETE /api/admin/gallery creates and removes galleryEvent documents in Sanity",
      "Highlights API — POST/DELETE /api/admin/highlights creates highlightVideo with either youtubeId or r2Url",
      "highlightVideo Sanity schema updated — youtubeId now optional, r2Url field added",
      "VideoCollectionFolder updated — R2 videos render with inline <video> player + download button; YouTube keeps thumbnail-link behavior; folder badge shows Video / YouTube badges",
      "U11/U12 team switcher — prominent toggle in page header; switching reloads server data for that team (force-dynamic + revalidate:0)",
      "Team state bug fixed — key={team} on MediaAdmin forces full remount on team switch so useState doesn't bleed across teams",
      "R2 credentials added to .env.local — copied from kickreel project (same bucket)",
      "Uploaded 4 U12 highlight videos via API directly to R2 + created Sanity docs under Highlights event",
    ],
  },
  {
    date: "2026-10-18",
    title: "Session 17 — Player Photo Upload Polish, Monitoring Fixes & Frictionless Family Access",
    hours: 9.0,
    commits: 11,
    claudeCostUSD: 25.00,
    features: [
      // ── Game day ───────────────────────────────────────────────────────────
      "U11 Oct 18 result logged — W 8-0 vs Elgin United Hernandez; standings updated for both U11 and U12",
      "Tracker dropdown fix — opponent names corrected (Ramirez/Hernandez swap); U11/U12 fallback standings synced to Oct 18 GotSport snapshot",
      // ── Player photo upload ────────────────────────────────────────────────
      "Photo crop/reposition step — after selecting a photo, parents drag to reposition and pinch/scroll to zoom before uploading; uses CSS object-position stored as x/y %",
      "Upload hint below field view — subtle prompt nudges parents to tap a player token to submit a photo",
      "Photo token standardization — all player tokens on field view rendered at the same height regardless of photo vs. number-only state",
      "Portrait oval photo tokens — player photos displayed in portrait oval shape on roster field view instead of circular crop; matches the tall format of player cards",
      "Click-to-enlarge lightbox — tapping a player photo on the roster opens a full-screen lightbox with smooth fade-in; closes on tap or ESC",
      // ── Monitoring dashboard ───────────────────────────────────────────────
      "Monitoring dashboard timezone fix — all timestamps and daily buckets now display in America/Chicago (CDT); was rendering in UTC causing off-by-one day issues",
      "Push breakdown panel — subscriber count split by platform (iOS / Android / Desktop) in the monitoring dashboard",
      "Daily table cleanup — monitoring dashboard daily stats table trimmed to last 14 days; older rows auto-purged",
      // ── Family access ──────────────────────────────────────────────────────
      "Magic link auto-login — /api/family/magic?t=<token> logs parents in with one tap from the group chat; no PIN entry required; token derived from FAMILY_PASSCODE so it auto-rotates on passcode change",
      "4-digit PIN pad — replaces text passcode input with 4 separate boxes; auto-advance on each digit, backspace navigates back, paste supported, numeric keyboard on mobile",
      "6-month cookie — extended from 30 days so families who type the PIN once won't see the gate again all season",
      "Admin Family Access Link card — magic URL shown at the bottom of the admin dashboard with a one-click copy button for Coach to share in the group chat",
    ],
  },
  {
    date: "2026-10-17",
    title: "Session 16 — KickReel Admin, Live Stat Tracker, Standings Scraper & Game-Day UX",
    hours: 9.25,
    commits: 16,
    claudeCostUSD: 67.70,
    features: [
      // ── North Legends ──────────────────────────────────────────────────────
      "Live standings scraper — U11 & U12 standings now fetched and parsed from GotSport HTML on each request; falls back to hardcoded arrays if fetch fails; no more manual entry after each round",
      "Game-day reminder overhaul — Vercel cron moved to 4 AM CDT; schedules QStash push 2h before kickoff and result-checker 90min post-kickoff; morning games can no longer be missed",
      "QStash region fix — pass baseUrl: QSTASH_URL (US East) to QStash client; EU default was returning 404 and exhausting retries silently",
      "Player photos on roster field view — photo replaces number-only pill when Sanity has a photo; number shown below photo if available",
      "North Legends FC favicon — replaced Vercel triangle with club logo (app/icon.png + apple-icon.png); builds with Turbopack again after ICO format dropped",
      "Distinctive tab titles — home shows live countdown, /neo gets Matrix-themed 'NEO ◼◼◼', /admin gets 'Admin Panel'",
      "Location pill + weather on home countdown — taps to Google Maps; weather widget (dark variant) appears when within 5-day forecast window",
      "U12 result-checker fixed — GOTSPORT_URLS was missing the u12 entry; added correct schedule URL",
      "Tracker date filter — match list now filters by date so past games don't appear as upcoming in the live stat tracker",
      "Mobile match table scroll — horizontally scrollable on small screens so stat columns don't clip",
      "U11 & U12 standings synced manually to official GotSport tables after discovering hardcoded data was stale (trigger for building the scraper)",
      // ── KickReel ───────────────────────────────────────────────────────────
      "Live game stat tracker — coaches log substitutions, events, and lineup changes live during matches; stored in Redis, viewable per team/match",
      "KickReel admin page — /admin/kickreel hub for managing tracker sessions, reviewing runs, and triggering pipeline actions",
      "Analytics panels fix — second-half-only footage no longer breaks heatmap/timeline panels (null check on first-half clip array)",
      "Article detail cover image — match recap pages now show the video cover image at the top",
      "Article generation fix — match data passed from client at generate time instead of a redundant Sanity lookup that could return stale data",
      "Articles admin GotSport integration — match picker in articles admin now pulls live schedule from GotSport instead of requiring Sanity entries",
      "Videos section in news articles — article pages link out to the matching KickReel session when footage exists",
      "PWA share button in nav — installed PWA shows native share sheet for the current page URL",
    ],
  },
  {
    date: "2026-10-17",
    title: "Session 15 — Arrival Times, QStash Result Checker & Oct 17 U11 Result",
    hours: 3.75,
    commits: 3,
    claudeCostUSD: 22.35,
    features: [
      "Arrival vs kickoff times — schedule now shows 'Arrive by X:XX' prominently before kick-off time so families know when to show up",
      "U11 Oct 17 game result entered manually in the admin panel",
      "Smart result-checker cron — polls GotSport every 30 min starting after estimated game end; no idle pings during unrelated hours",
      "QStash-driven result checker — zero idle Vercel cron invocations; QStash handles all polling scheduling and retries automatically",
    ],
  },
  {
    date: "2026-10-16",
    title: "Session 14 — Announcement Expiration, Scheduling & Archive",
    hours: 1.0,
    commits: 1,
    claudeCostUSD: 2.86,
    features: [
      "Announcement expiration (expiresAt) — auto-hides from main page after set time; admin form defaults to 48h from now, clearable for permanent posts",
      "Announcement scheduling (publishesAt) — 'Schedule for later' checkbox reveals picker; announcement stays hidden until publish time",
      "DELETE API at /api/admin/announcements/[id] — coach can delete any announcement; ✕ button per card in admin with confirm dialog",
      "Status badges in admin list: Active (green) / No expiry / Expired (dimmed) / Scheduled (blue) with publish date shown",
      "Public /announcements page now splits active vs archived (expired) with a 'Past Announcements' divider — always reachable even with no active banner",
      "Footer always shows Announcements link; home page shows subtle '📣 View past announcements →' fallback when no active banner",
      "Sanity query revalidate reduced from 300s → 60s so scheduled posts appear within a minute of publish time",
      "All new strings fully bilingual (EN/ES) — admin form labels, public page headings, status badges",
    ],
  },
  {
    date: "2026-10-16",
    title: "Session 13 — Search, Photo Submissions, Game-Day Push, Monitoring & Tutorials",
    hours: 1.5,
    commits: 8,
    claudeCostUSD: 14.31,
    features: [
      "Global search (⌘K) — covers players, news, announcements, real schedule (GotSport), and nav pages; fixed GROQ wildcard + month-name lookup (oct, storm, etc.)",
      "Parent photo submission flow — family-passcode gated, submit/update/delete from roster, admin approval queue at /admin/photos",
      "Game-day push reminders — Vercel native cron (noon CDT daily) calls /api/cron/game-day-reminder, fires broadcastPush for each U11+U12 match within 24h",
      "GotSport scraper expanded from Monday-only to Sat+Sun+Mon nights",
      "Site monitoring dashboard at /neo/monitoring — anonymous page-view tracking in Redis (ZINCRBY + HINCRBY + HyperLogLog), 14-day bar chart, top pages, push subscriber count",
      "What's New modal — 3-step bilingual walkthrough (Search, Photos, Push) shown once per version; bumped to v3 after bilingual fix",
      "Push notification tutorial modal — iOS and Android step-by-step how-to (EN + ES); PushPermission now shows install prompt to iOS non-standalone users",
      "All new modals fully bilingual (EN/ES) via next-intl — WhatsNew, PushTutorial, PushBanner keys added to both message files",
      "Removed 3 accidental Finder duplicate component files (ScrollDepthTracker 2, TrackedAnchor 2, TrackedLink 2)",
    ],
  },
  {
    date: "2026-10-16",
    title: "Session 12 — Full Admin Bilingual Split",
    hours: 1.0,
    commits: 4,
    claudeCostUSD: 5.98,
    features: [
      "Admin UI fully split into English/Spanish pages — whole-page toggle (EN/ES pill) in every header, same locale cookie as main site",
      "AdminLangToggle component: sets NEXT_LOCALE cookie + router.refresh(), consistent across all admin pages",
      "Announcements admin: coaches write in their language (EN default), Claude auto-translates the other direction",
      "Articles admin: coachLanguage driven by page locale — Spanish notes correctly interpreted by Claude",
      "CoachVotes rebuilt with WishlistSection card style — emoji + title + desc + priority button, matches parents roadmap voting",
      "AdminBreadcrumb restored to all admin pages with bilingual crumbs (Dashboard→Page, Panel→Página in Spanish)",
      "All per-field language toggles removed in favor of whole-page locale switch",
    ],
  },
  {
    date: "2026-10-16",
    title: "Session 11 — Admin Bug Fixes",
    hours: 0.5,
    commits: 1,
    claudeCostUSD: 1.98,
    features: [
      "Announcements admin fully bilingual — all labels show ES/EN side by side",
      "Translation direction reversed: Hugo writes in Spanish, Claude translates to English",
      "Announcements form: U11 / U12 / Ambos team picker — 'both' sends two requests",
      "Articles admin: U11/U12 tab switcher in header for quick team switching",
      "Coach votes admin: bilingual labels (Prioridad/Priority, Estadísticas/Player stats, etc.)",
      "Tracker work log now sorts sessions ascending by session number (1→11)",
      "Community voting moved from Coming Next to Live Now on roadmap (EN + ES)",
    ],
  },
  {
    date: "2026-10-15",
    title: "Session 10 — Community + Coach Voting",
    hours: 0.5,
    commits: 2,
    claudeCostUSD: 5.78,
    features: [
      "Community voting on wishlist cards — thumbs-up button, 1 vote per device, optimistic UI",
      "Server-authoritative vote toggle — httpOnly device cookie + Redis Set eliminates vote inflation & underflow",
      "Coach priority flags on /admin/votes — toggle per wishlist item, shows community counts",
      "Voting admin table on /neo — community counts, coach flags, Easy/Medium/Hard difficulty selector",
      "Feature Voting card added to /admin/dashboard hub",
      "Upstash Redis credentials wired into .env.local (legends-pitch database)",
      "Security fix: removed hasVoted client trust; server owns vote state via Redis SISMEMBER",
    ],
  },
  {
    date: "2026-07-03",
    title: "Session 1 — Launch",
    hours: 4,
    commits: 5,
    claudeCostUSD: 8,
    features: [
      "Initial Next.js site with Tailwind + next-intl (EN/ES)",
      "Hero section with Insta360 tournament video background",
      "Public highlights page with 8 Soccer Clinic 2026 YouTube clips",
      "Admin panel — editable highlights tab",
      "Vercel deployment setup",
    ],
  },
  {
    date: "2026-10-08",
    title: "Session 2 — KickReel & Analytics",
    hours: 8,
    commits: 7,
    claudeCostUSD: 18,
    features: [
      "KickReel /videos section with Sanity-backed session viewer",
      "Full Sanity CMS migration — all content moved off static files",
      "Phase 2 analytics UI: field heatmap bubbles + activity timeline",
      "Per-half heatmap tabs, halftime normalization, goal pressure %",
      "Marker chip seek — jumps to nearest clip by timestamp",
      "TypeScript strict fixes across entire build",
    ],
  },
  {
    date: "2026-10-10",
    title: "Session 3 — Video UX & Gallery",
    hours: 10,
    commits: 14,
    claudeCostUSD: 25,
    features: [
      "Video half-grouping (1st / 2nd / Celebration), loading spinner",
      "Analytics redesign: bubble heatmap, timeline bars, per-half goal pressure",
      "Google Drive full-game banner in session viewer",
      "Parent save-clip button with Sanity save-count sync",
      "Gallery rebuilt as album cards with full-screen lightbox",
      "Coach onboarding form — saves to Sanity coachSubmission document",
      "Weather forecast on upcoming fixtures via Open-Meteo (no API key)",
      "Calendar subscription — webcal / Google Calendar / .ics download",
      "Google Maps links on schedule locations",
      "Vercel Analytics integration",
      "iOS video buffering and concurrent load fixes",
    ],
  },
  {
    date: "2026-10-11",
    title: "Session 4 — Auth, Nav & Polish",
    hours: 14,
    commits: 20,
    claudeCostUSD: 35,
    features: [
      "SportsYou iCal integration — U11 schedule pulled live (no manual entry)",
      "America/Chicago timezone fix across all date/time displays",
      "Family passcode gate — /videos, /gallery, /highlights protected",
      "Contact page reads live from Sanity coachSubmission (no more hardcoded data)",
      "Public roadmap page with Known Bugs, Coming Next, Wishlist + feedback form",
      "Hamburger mobile menu — all 8 nav links, auto-closes on route change",
      "First-visit NavTip banner pointing parents to ☰ (dismissed via localStorage)",
      "Home field updated to Jarrell Elementary School",
      "Hero carousel expanded to 4 slides: video + 2026 team photo + sponsors banner",
      "Sponsors section on home page — Houk AC + Bonilla's Painting + 'Become a sponsor' CTA",
      "Video player: first goal auto-plays on load, goals chain automatically",
      "Video player: clip counter heading (CLIP N / M + bold clip name)",
      "Video player: prefetch next 2 clips in background while current plays",
      "Roadmap fully bilingual (EN/ES) with all 16 items translated",
      "Bottom tab bar removed — hamburger handles all navigation",
    ],
  },
  {
    date: "2026-10-12",
    title: "Session 7 — Analytics, Sponsors & UX Polish",
    hours: 3,
    commits: 8,
    claudeCostUSD: 15,
    features: [
      "Vercel Analytics custom events — scroll depth milestones (25/50/75/100%), hero CTA clicks, news article clicks, sponsor email CTA",
      "Vercel Speed Insights — Core Web Vitals (LCP, CLS, FID, TTFB) per page",
      "Fixed Vercel preview deployments — ignoreCommand skips all non-main branches",
      "Sponsor cards made clickable — Houk AC → houkac.com, Bonilla's → Facebook page",
      "Real sponsor logos replacing emojis — Houk SVG from site, Bonilla's logo PNG",
      "Facebook 'Follow us' button in footer — FB blue branded button, replaces invisible red text link",
      "Hero carousel cleanup — removed team-photo.jpg and sponsors-banner.jpg (video + 2026 photo only)",
    ],
  },
  {
    date: "2026-10-12",
    title: "Session 6 — Open Source, Docs & GitHub Integration",
    hours: 4,
    commits: 5,
    claudeCostUSD: 22,
    features: [
      "Rewrite README — reflects live stack (Sanity, KickReel, auth, rate limiting)",
      "TECHNICAL.md — full architecture reference with 5 Mermaid diagrams",
      "CONTRIBUTING.md — three contribution paths (form → issue → PR)",
      ".env.example template for contributors",
      "Feedback form → GitHub Issues integration (GITHUB_ISSUES_TOKEN, label mapping)",
      "Footer open-source contribute link (EN + ES)",
      "Branch protection on main — PRs required, force-push blocked, linear history",
      "Repo made public — github.com/ErickZBrambila/legends-pitch",
      "Upstash Redis + GITHUB_ISSUES_TOKEN confirmed live in Vercel",
      "Vercel production branch wired to main — auto-deploy on PR merge",
    ],
  },
  {
    date: "2026-10-12",
    title: "Session 5 — Security, Tracker & Foldable",
    hours: 6,
    commits: 9,
    claudeCostUSD: 28,
    features: [
      "Full security audit + hardening (CSP, HSTS, cookie flags, GROQ injection, SSRF)",
      "Rate limiting on all auth + public write routes (Upstash Redis, graceful degradation)",
      "Onboarding route disabled by default — activated on demand via ONBOARDING_ENABLED env var",
      "Admin project tracker: per-session Claude cost, cost-per-feature stats",
      "Admin hub replacing old dead-code dashboard (Sanity Studio + Tracker cards)",
      "Hero carousel wired into home page (was built but never imported)",
      "Video player: clip title moved above video, iOS mediaSession branding fix",
      "Hamburger nav: left/right-handed toggle in drawer (persists to localStorage)",
      "iPhone Duo / foldable support: CSS viewport-segments two-panel layout on video page",
      "KickReel tracker: Oct 10 vs Elgin United (72 clips, 7 goals, analytics) added",
    ],
  },
  {
    date: "2026-10-14",
    title: "Session 9 — Push Notifications, iOS PWA & Site Banner",
    hours: 4,
    commits: 17,
    claudeCostUSD: 28,
    features: [
      "iOS home screen icon — apple-icon.png + manifest.ts for correct PWA branding",
      "Add to Home Screen tutorial — iOS-only slide-up sheet with step-by-step instructions",
      "Web push notifications (iOS + Android) — VAPID, service worker, Upstash Redis subscription store",
      "Auto-push on new announcements and published news articles",
      "Full push debug journey — fixed double JSON serialization, old SW staying active, TTL=0 drops, urgency:normal delay",
      "Site-wide admin banner — maintenance / incident / info types stored in Redis",
      "Banner sends push notifications to all devices on post + shows device count",
      "Client-side banner — fetches on mount + visibilitychange so iOS PWA updates on resume",
      "Banner clear button reactive — UI updates immediately without page refresh",
    ],
  },
  {
    date: "2026-10-13",
    title: "Session 8 — Article Generator & Admin Polish",
    hours: 7,
    commits: 1,
    claudeCostUSD: 22,
    features: [
      "EN/ES language selector hidden on /admin and /neo routes (middleware x-pathname header)",
      "AI article generator — Claude Haiku writes bilingual match recaps from match data or free-form context",
      "Tone picker (Friendly / Formal / Hype) on generate form, draft cards, and edit form",
      "Draft cards: collapsed preview with Regen + tone controls, expandable edit form",
      "Delete button on draft cards with 90-day server-side auto-purge on page load",
      "sourceMatchId + sourceFreeFormContext stored on posts — Regen always uses original context",
      "Regen fallback: old drafts with no source data use title + excerpt as context",
      "Free-form article mode — write about anything (team news, tournaments, off-season)",
      "Matrix-themed /neo login page with canvas rain animation",
    ],
  },
];

export const KICKREEL_RUNS: KickReelRun[] = [
  {
    date: "2026-07-03",
    label: "Soccer Clinic 2026",
    team: "U11",
    type: "Tournament",
    clipsExtracted: 8,
    uploadedToR2: false,
    publishedToSanity: false,
    notes: "Filmed with Insta360. Clips published manually to YouTube Highlights page (pre-pipeline).",
  },
  {
    date: "2026-10-10",
    label: "vs Elgin United",
    team: "U11",
    type: "Game",
    clipsExtracted: 72,
    uploadedToR2: true,
    publishedToSanity: true,
    notes: "7 goals · full-game analytics: field heatmap, per-half activity timeline, goal pressure %. Full 4K game on Google Drive.",
  },
  // Add future pipeline runs here:
  // { date: "YYYY-MM-DD", label: "vs Opponent", team: "U11", type: "Game", clipsExtracted: 0, uploadedToR2: true, publishedToSanity: true },
];

export interface HardwareLine {
  name: string;
  purpose: string;
  purchasedDate: string;
  costUSD: number;
  notes: string;
}

export const HARDWARE: HardwareLine[] = [
  {
    name: "Falcon XBotGo 360° Camera",
    purpose: "Automated match filming — AI tracking + 360° capture for KickReel pipeline",
    purchasedDate: "2026-07-03",
    costUSD: 709.00,
    notes: "Primary capture device. Mounts on sideline tripod, tracks play autonomously. Footage processed by KickReel pipeline → R2 → Sanity.",
  },
  {
    name: "Falcon XBotGo Tripod",
    purpose: "Sideline mount for the XBotGo camera",
    purchasedDate: "2026-07-03",
    costUSD: 197.44,
    notes: "Required for stable sideline placement. Bundled purchase with camera.",
  },
];

export function totalHardwareCost() {
  return HARDWARE.reduce((s, h) => s + h.costUSD, 0);
}

export const SERVICES: ServiceLine[] = [
  {
    name: "Vercel",
    purpose: "Hosting & deployment (Next.js)",
    plan: "Hobby (free)",
    monthlyCostUSD: 0,
    annualCostUSD: 0,
    notes: "Free indefinitely for personal/hobby projects. Upgrade to Pro ($20/mo) if we need team members or >100GB bandwidth.",
  },
  {
    name: "Sanity CMS",
    purpose: "Content — schedule, roster, news, gallery, sessions, coach data",
    plan: "Free tier",
    monthlyCostUSD: 0,
    annualCostUSD: 0,
    notes: "Free up to 100k API requests/month and 5GB dataset. Well within limits for this size team.",
  },
  {
    name: "Cloudflare R2",
    purpose: "Video & clip storage (KickReel footage)",
    plan: "Free tier",
    monthlyCostUSD: 0,
    annualCostUSD: 0,
    notes: "Free up to 10GB storage, 1M writes, 10M reads/month. ⚠️ CDN requires custom domain — pending northlegensfc.com credentials. Without it, videos load from origin on every request.",
  },
  {
    name: "Open-Meteo",
    purpose: "Weather forecasts on schedule page",
    plan: "Free (no API key)",
    monthlyCostUSD: 0,
    annualCostUSD: 0,
    notes: "Non-commercial use is free. No key required.",
  },
  {
    name: "SportsYou",
    purpose: "U11 game schedule (iCal feed)",
    plan: "Free (webcal feed)",
    monthlyCostUSD: 0,
    annualCostUSD: 0,
    notes: "Polled every hour via Next.js fetch cache. No API key — public webcal URL.",
  },
  {
    name: "northlegensfc.com",
    purpose: "Custom domain (pending — needed for R2 CDN)",
    plan: "Paid domain",
    monthlyCostUSD: 1.25,
    annualCostUSD: 15,
    notes: "~$15/year. Waiting on Cloudflare admin credentials to connect to R2 bucket and Vercel.",
  },
];

export function totalHours() {
  return SESSIONS.reduce((s, session) => s + session.hours, 0);
}

export function totalClaudeCost() {
  return SESSIONS.reduce((s, session) => s + session.claudeCostUSD, 0);
}

export function totalCommits() {
  return SESSIONS.reduce((s, session) => s + session.commits, 0);
}

export function totalFeatures() {
  return SESSIONS.reduce((s, session) => s + session.features.length, 0);
}

export function monthlyRunningCost() {
  return SERVICES.reduce((s, svc) => s + svc.monthlyCostUSD, 0);
}

export function annualRunningCost() {
  return SERVICES.reduce((s, svc) => s + svc.annualCostUSD, 0);
}

// ── TCO ──────────────────────────────────────────────────────────────────────
// Total Cost of Ownership: what it actually cost to build and run this platform.

// Agency/freelancer equivalent — what this would cost if outsourced:
// Junior dev @ $75/hr or boutique agency quote (~$40K for scope delivered)
const AGENCY_RATE_USD_PER_HOUR = 150;
const AGENCY_FIXED_QUOTE_USD   = 40_000; // realistic agency quote for this feature set

export interface TCOSummary {
  // Build costs (one-time)
  devHours: number;
  claudeCostUSD: number;
  hardwareCostUSD: number;
  totalBuildCostUSD: number;        // Claude + hardware (owner labor = $0)

  // Running costs (ongoing)
  monthlyRunningCostUSD: number;
  annualRunningCostUSD: number;

  // 3-year TCO
  threeYearTCOUSD: number;          // build + 3 years of running costs

  // vs. alternatives
  agencyEquivalentUSD: number;      // what an agency would have charged
  freelancerEquivalentUSD: number;  // devHours × $150/hr
  savingsVsAgencyUSD: number;
  savingsVsFreelancerUSD: number;

  // Efficiency
  costPerFeature: number;           // claudeCost / features shipped
  costPerCommit: number;            // claudeCost / commits
}

export function tco(): TCOSummary {
  const devHours            = totalHours();
  const claudeCostUSD       = totalClaudeCost();
  const hardwareCostUSD     = totalHardwareCost();
  const totalBuildCostUSD   = claudeCostUSD + hardwareCostUSD;
  const monthlyRunning      = monthlyRunningCost();
  const annualRunning       = annualRunningCost();
  const threeYearTCOUSD     = totalBuildCostUSD + annualRunning * 3;
  const freelancerEq        = devHours * AGENCY_RATE_USD_PER_HOUR;

  return {
    devHours,
    claudeCostUSD,
    hardwareCostUSD,
    totalBuildCostUSD,
    monthlyRunningCostUSD:    monthlyRunning,
    annualRunningCostUSD:     annualRunning,
    threeYearTCOUSD,
    agencyEquivalentUSD:      AGENCY_FIXED_QUOTE_USD,
    freelancerEquivalentUSD:  freelancerEq,
    savingsVsAgencyUSD:       AGENCY_FIXED_QUOTE_USD  - totalBuildCostUSD,
    savingsVsFreelancerUSD:   freelancerEq            - totalBuildCostUSD,
    costPerFeature:           claudeCostUSD / totalFeatures(),
    costPerCommit:            claudeCostUSD / totalCommits(),
  };
}
