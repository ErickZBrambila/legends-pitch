import type { Match, Player, NewsPost, GalleryEvent, SeasonStats } from "./types";

export const matches: Match[] = [
  {
    id: "1",
    date: "2026-03-08T10:00:00",
    opponent: "Riverside FC",
    location: "Westfield Park – Field 3",
    homeAway: "home",
    goalsFor: 3,
    goalsAgainst: 1,
    result: "W",
  },
  {
    id: "2",
    date: "2026-03-15T09:30:00",
    opponent: "Valley Eagles",
    location: "Eagle Ridge Sports Complex",
    homeAway: "away",
    goalsFor: 2,
    goalsAgainst: 2,
    result: "D",
  },
  {
    id: "3",
    date: "2026-03-22T10:00:00",
    opponent: "Sunset United",
    location: "Westfield Park – Field 1",
    homeAway: "home",
    goalsFor: 4,
    goalsAgainst: 0,
    result: "W",
  },
  {
    id: "4",
    date: "2026-03-29T09:00:00",
    opponent: "Harbor City Kickers",
    location: "Harbor Sports Fields",
    homeAway: "away",
    goalsFor: 1,
    goalsAgainst: 2,
    result: "L",
  },
  {
    id: "5",
    date: "2026-04-05T10:00:00",
    opponent: "Northside Stars",
    location: "Westfield Park – Field 2",
    homeAway: "home",
    goalsFor: 2,
    goalsAgainst: 1,
    result: "W",
  },
  {
    id: "6",
    date: "2026-07-12T10:00:00",
    opponent: "Eastside Phoenix",
    location: "Westfield Park – Field 3",
    homeAway: "home",
    goalsFor: null,
    goalsAgainst: null,
    result: null,
  },
  {
    id: "7",
    date: "2026-07-19T09:30:00",
    opponent: "Lakewood FC",
    location: "Lakewood Recreation Center",
    homeAway: "away",
    goalsFor: null,
    goalsAgainst: null,
    result: null,
  },
  {
    id: "8",
    date: "2026-07-26T10:00:00",
    opponent: "Golden Gate Youth",
    location: "Westfield Park – Field 1",
    homeAway: "home",
    goalsFor: null,
    goalsAgainst: null,
    result: null,
  },
];

export const players: Player[] = [
  { id: "1", name: "Alex", number: 1, position: "GK" },
  { id: "2", name: "Jordan", number: 2, position: "DEF" },
  { id: "3", name: "Sam", number: 3, position: "DEF" },
  { id: "4", name: "Taylor", number: 4, position: "DEF" },
  { id: "5", name: "Riley", number: 5, position: "DEF" },
  { id: "6", name: "Casey", number: 6, position: "MID" },
  { id: "7", name: "Morgan", number: 7, position: "MID" },
  { id: "8", name: "Drew", number: 8, position: "MID" },
  { id: "9", name: "Jamie", number: 9, position: "FWD" },
  { id: "10", name: "Quinn", number: 10, position: "FWD" },
  { id: "11", name: "Avery", number: 11, position: "FWD" },
  { id: "12", name: "Reese", number: 12, position: "MID" },
];

export const newsPosts: NewsPost[] = [
  {
    id: "1",
    slug: "great-win-vs-northside",
    title: "Great Team Effort — 2-1 Win vs Northside Stars!",
    excerpt:
      "The North Legends showed tremendous heart in a hard-fought 2-1 victory over Northside Stars on Saturday.",
    body: `What a match! The North Legends showed tremendous heart in a hard-fought 2-1 victory over Northside Stars on Saturday morning at Westfield Park.

Quinn opened the scoring in the 18th minute with a brilliant left-footed strike from just outside the box. Northside equalized shortly after halftime, but the team responded strongly. With 10 minutes left, Jamie latched onto a perfect through-ball and slotted it past the keeper.

A huge shoutout to Alex for some incredible saves in the second half — you kept us in it! And to every single player who gave 100% from first whistle to last.

Next up: **Eastside Phoenix at home on July 12th.** Let's keep the momentum going!`,
    publishedAt: "2026-04-06T18:00:00",
    author: "Coach Martinez",
  },
  {
    id: "2",
    slug: "practice-schedule-update",
    title: "Practice Schedule Update — July",
    excerpt:
      "Quick update on our July practice schedule including the extra session before the Eastside game.",
    body: `Parents and players,

Just a quick update on our July schedule:

- **July 7 (Tue)** — Regular practice, 6:00–7:30 PM, Westfield Park Field 4
- **July 10 (Fri)** — Extra prep session before Eastside, 6:00–7:00 PM (optional but recommended)
- **July 12 (Sun)** — Game vs Eastside Phoenix, 10:00 AM, Westfield Park Field 3
- **July 14 (Tue)** — Regular practice, 6:00–7:30 PM

Please make sure players arrive **15 minutes early** for games — warm-up starts promptly.

Any questions, reach out at northlegends@gmail.com.

Go Legends! 🟢`,
    publishedAt: "2026-07-01T09:00:00",
    author: "Coach Martinez",
  },
  {
    id: "3",
    slug: "welcome-to-the-summer-season",
    title: "Welcome to the Summer Season!",
    excerpt:
      "The North Legends are kicking off the Summer 2026 season — here's what to expect.",
    body: `Welcome back, North Legends family!

We're so excited to kick off the Summer 2026 season. After a strong spring run (4W-1L-1D), we're going into summer with great confidence and even higher ambitions.

A few things to know:
- We have **8 games** scheduled through August
- Practice is every **Tuesday evening, 6–7:30 PM** at Westfield Park
- Please update your emergency contact info if anything has changed

We have a talented group of kids this season and I can't wait to see them grow. Let's have fun, play hard, and support each other every step of the way.

See you on the pitch — Go Legends!`,
    publishedAt: "2026-07-01T08:00:00",
    author: "Coach Martinez",
  },
];

export const galleryEvents: GalleryEvent[] = [
  {
    id: "1",
    title: "Spring Season Highlights",
    date: "2026-04-05T10:00:00",
    images: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
        alt: "Team huddle before the game",
      },
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
        alt: "Goal celebration",
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80",
        alt: "Mid-game action",
      },
      {
        id: "4",
        url: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80",
        alt: "Free kick setup",
      },
    ],
  },
  {
    id: "2",
    title: "Team Practice – June",
    date: "2026-06-15T18:00:00",
    images: [
      {
        id: "5",
        url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80",
        alt: "Dribbling drills",
      },
      {
        id: "6",
        url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
        alt: "Passing practice",
      },
    ],
  },
];

export function getSeasonStats(): SeasonStats {
  const played = matches.filter((m) => m.result !== null);
  return {
    wins: played.filter((m) => m.result === "W").length,
    losses: played.filter((m) => m.result === "L").length,
    draws: played.filter((m) => m.result === "D").length,
    goalsFor: played.reduce((sum, m) => sum + (m.goalsFor ?? 0), 0),
    goalsAgainst: played.reduce((sum, m) => sum + (m.goalsAgainst ?? 0), 0),
  };
}

export function getNextMatch(): Match | null {
  const now = new Date();
  return (
    matches
      .filter((m) => m.result === null && new Date(m.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
  );
}

export function getPostBySlug(slug: string): NewsPost | undefined {
  return newsPosts.find((p) => p.slug === slug);
}
