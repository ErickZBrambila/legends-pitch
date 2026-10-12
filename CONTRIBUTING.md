# Contributing to North Legends FC

Thanks for wanting to help! This is the website for a youth soccer club, built and maintained by parents and coaches. Whether you write code every day or have never opened a terminal, there's a way to contribute.

---

## Who can contribute

- **Parents** — you know what's missing or broken better than anyone
- **Coaches** — content improvements, schedule accuracy, new feature ideas
- **Soccer fans / developers** — all skill levels welcome

---

## Ways to contribute

### 1. Use the feedback form (easiest — no GitHub needed)

Go to the **[Roadmap page](https://legends-pitch.vercel.app/roadmap)** on the live site and submit your idea or bug report at the bottom. It takes 30 seconds. We read every message.

### 2. Open a GitHub issue

If you have a GitHub account, you can open an issue directly:

- **Bug report:** Describe what you expected vs. what happened. Include the device/browser if it's a display issue.
- **Feature request:** Describe the feature and who it helps (parents? coaches? players?).
- **Question:** Not sure if something is a bug? Open an issue and ask.

Issues filed here also get created automatically when parents submit the roadmap feedback form.

### 3. Submit a pull request (code changes)

If you want to fix something or build a feature yourself, follow the steps below.

---

## Local Setup

```bash
# 1. Fork the repo and clone your fork
git clone https://github.com/YOUR_USERNAME/legends-pitch.git
cd legends-pitch

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in your values — see README.md for what each var does

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** You'll need a Sanity project to see real content. The README has the full list of required env vars. For local testing, you can use a free Sanity project with your own data.

---

## Branch Naming

Use a short prefix to keep branches organized:

| Prefix | When to use |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Dependency updates, config changes, cleanup |

Examples: `feature/parent-photo-uploads`, `fix/schedule-timezone`, `chore/update-tailwind`

---

## PR Checklist

Before opening a pull request:

- [ ] `npm run build` passes with no TypeScript errors
- [ ] No hardcoded secrets, passwords, or API keys in the code
- [ ] If you added user-facing text: added both English **and** Spanish translations (the `CONTENT` object in each page file has `en` and `es` keys — add to both)
- [ ] If you changed a Sanity schema type: schema changes need to be deployed separately (`npx sanity deploy`) — mention this in your PR description

Keep PRs focused. A fix for one bug is easier to review than five bugs fixed in one commit.

---

## Sanity Schema Changes

Content types (match, player, post, gallery, etc.) are defined in `schemaTypes/`. If you add or change a schema:

1. Make your changes in `schemaTypes/`
2. Test locally at `/studio`
3. Note in your PR that a schema deploy is needed — the repo maintainer will run `npx sanity deploy` after merging

---

## Code of Conduct

This is a community built around kids playing soccer. Keep it that way:

Be respectful, assume good intent, and keep discussions family-friendly. Feedback on code is welcome; personal criticism is not. If someone is new to open source, help them — we were all beginners once.

---

## Questions?

Open an issue or use the [roadmap feedback form](https://legends-pitch.vercel.app/roadmap) on the site. Either way, we'll see it.
