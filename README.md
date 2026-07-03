# legends-pitch — North Legends FC Website

A public-facing team website for the **North Legends**, a U9–U12 youth soccer team. Built so parents can check the schedule, players can see the roster, and the coach can post news — all without anyone needing to touch code after launch.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components, ISR, file-based routing |
| Styling | Tailwind CSS v4 | Utility-first, easy responsive breakpoints |
| CMS (planned) | Sanity.io | Coach-friendly Studio UI, free tier, real-time updates |
| Hosting | Vercel | Zero-config Next.js deploy, free hobby tier |

During development the site runs off **mock data** in `lib/data.ts`. Once Sanity is connected, data fetching moves to `lib/queries.ts` with GROQ and the mock file is retired.

---

## Project Structure

```
legends-pitch/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout: nav + footer wrapper
│   ├── page.tsx                # Home: hero, countdown, season stats
│   ├── schedule/page.tsx       # Fixtures & results
│   ├── roster/page.tsx         # Player cards
│   ├── news/page.tsx           # Announcements list
│   ├── news/[slug]/page.tsx    # Individual post
│   ├── gallery/page.tsx        # Photo gallery by event
│   ├── contact/page.tsx        # Info, map embed, coach contact
│   └── globals.css             # CSS custom properties (team colors)
│
├── components/                 # Shared UI components
│   ├── Nav.tsx                 # Desktop/tablet top navigation
│   ├── MobileNav.tsx           # Phone bottom tab bar
│   └── Footer.tsx              # Site footer
│
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   └── data.ts                 # Mock data + helper functions
│
└── public/                     # Static assets (logo, og-image)
```

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Hero / Landing** | Full-width banner, team name, season tagline, live countdown to next game |
| 2 | **Schedule & Results** | All fixtures with date, opponent, location; past games show W/L/D score badge |
| 3 | **Roster** | Player cards with name, jersey number, and position — no personal info exposed |
| 4 | **News / Announcements** | Coach posts updates, practice cancellations, match recaps |
| 5 | **Photo Gallery** | Photos organized by event (game, practice) |
| 6 | **Season Stats** | Live record (W/L/D), goals scored and conceded |
| 7 | **Contact / Info** | Practice location and times, map embed, coach contact email |

---

## Responsive Design

The site adapts across three breakpoint tiers — one codebase, three distinct experiences:

| Breakpoint | Device | Navigation | Layout |
|---|---|---|---|
| `< 640px` | Phone | Sticky **bottom tab bar** (5 tabs) | Single-column stacked cards, large tap targets |
| `640px – 1024px` | Tablet | Collapsible **sidebar** | 2-column grids for schedule and roster |
| `> 1024px` | Desktop | **Top navbar** | 3-column roster grid, full-width hero background |

No user-agent detection or separate sites — everything is done with Tailwind's `sm:`, `md:`, and `lg:` responsive prefixes.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The site loads with **placeholder mock data** (fake player names, fake schedule, Unsplash photos). Replace it with real content using the coach onboarding form below, then swap the data source to Sanity once the CMS is set up.

---

## Content Management

### Current State (Development)
All content lives in `lib/data.ts`. Edit the arrays directly to update players, matches, news posts, and gallery events.

### Production (Sanity CMS)
When Sanity is wired up:
1. Coach logs into the Sanity Studio at `/studio` (embedded in the app)
2. Edits publish instantly — Next.js ISR revalidates pages within ~60 seconds
3. No code changes needed for schedule updates, roster edits, or news posts

Planned Sanity content types:
- **match** — date, opponent, location, homeAway, score, result
- **player** — name, number, position, photo
- **post** — title, slug, body (rich text), publishedAt
- **galleryEvent** — title, date, images[]

See `COACH_ONBOARDING.md` for the full list of information needed from the coach before launch.

---

## Customization

### Team Colors

Open `app/globals.css` and update the CSS custom properties in `:root`:

```css
:root {
  --color-primary:       #15803d;   /* Main green — change to your team color */
  --color-primary-dark:  #052e16;   /* Dark variant for hero backgrounds */
  --color-primary-light: #16a34a;   /* Hover/active states */
  --color-accent:        #ca8a04;   /* Gold accent — badge highlights, CTAs */
  --color-accent-light:  #fbbf24;   /* Light accent for text on dark backgrounds */
}
```

All components reference these variables, so one edit changes the whole site.

### Team Logo

Replace `public/logo.png` with your actual logo file. The `<img>` in `Nav.tsx` references this path.

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — click Deploy
4. Set environment variables (Sanity project ID, dataset, token) in the Vercel dashboard

### Sanity Studio

The Sanity Studio is embedded at the `/studio` route. To set it up:

1. Create a free project at [sanity.io](https://www.sanity.io)
2. Copy the **Project ID** and **Dataset** name
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```
4. Run `npx sanity@latest init --env` to finish setup
5. Visit `/studio` in dev or production to manage content

---

## Questions?

See `COACH_ONBOARDING.md` for the information needed from the coach to go live.
