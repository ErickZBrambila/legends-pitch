export interface WorkSession {
  date: string;
  title: string;
  hours: number;
  commits: number;
  features: string[];
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
    date: "2026-07-03",
    title: "Session 1 — Launch",
    hours: 4,
    commits: 5,
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
  {
    name: "Claude (Anthropic)",
    purpose: "AI assistant — site build, KickReel pipeline, all projects",
    plan: "API / Claude Code",
    monthlyCostUSD: 20,
    annualCostUSD: 240,
    notes: "Shared across multiple projects (legends-pitch, argus, AutoSense-AI, etc.). Estimate ~$20/mo — adjust as bills come in. Claude Code sessions drive most of the spend.",
  },
];

export function totalHours() {
  return SESSIONS.reduce((s, session) => s + session.hours, 0);
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
