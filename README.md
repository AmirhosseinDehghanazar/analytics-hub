<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██████╗ ███████╗██████╗  ██████╗                       ║
║   ██╔══██╗██╔════╝██╔══██╗██╔═══██╗                      ║
║   ██████╔╝█████╗  ██████╔╝██║   ██║                      ║
║   ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║                      ║
║   ██║  ██║███████╗██║     ╚██████╔╝                      ║
║   ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝  Analytics Hub        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**A lifetime GitHub traffic analytics hub — one dedicated repo tracking any number of your repos, zero clutter in the repos being tracked.**

[![Tests](https://img.shields.io/badge/tests-3%2F3%20passing-brightgreen?style=flat-square&logo=node.js)](collector/src/merge.test.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](tsconfig.json)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](#-license)
[![GitHub Pages](https://img.shields.io/badge/deploys%20to-GitHub%20Pages-purple?style=flat-square&logo=github)](https://pages.github.com)

</div>

---

## ✦ What this is

GitHub's built-in Traffic tab shows you the **last 14 days only** — and throws everything older away permanently. There's no archive, no export, no "since the beginning."

**Analytics Hub** closes that gap with three moving parts:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   GitHub Traffic API  ──▶  collector/   ──▶  data/<repo>/      │
│   (rolling 14-day)         (Node/TS)          history.json      │
│                                  │                  │           │
│                                  └──────────────────┘           │
│                                           │                     │
│                                           ▼                     │
│                                    dashboard/                   │
│                               (Vite + React + Recharts)         │
│                                           │                     │
│                                           ▼                     │
│                                    GitHub Pages                 │
│                              https://you.github.io/hub/        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| What you get | Detail |
|---|---|
| **Lifetime clone & view totals** | Accumulated since your first collection run |
| **Interactive traffic chart** | 7D / 14D / 30D / 90D / 6M / 1Y / ALL ranges |
| **Period-over-period growth** | 7, 30, and 90-day comparisons |
| **Peak day & peak month** | Automatic detection across all collected data |
| **Referrer snapshots** | Most recent known traffic sources |
| **Popular content** | Most visited paths in the current window |
| **Repo activity** | Stars, forks, watchers, open issues/PRs, releases |
| **CSV + JSON export** | Full daily timeline, downloadable on demand |
| **Multi-repo switcher** | Track multiple repos, flip between them in the dashboard |

> **Your tracked repos stay 100% clean.** No workflows, no data folders, nothing added to them — all the tooling lives here in the hub.

---

## ✦ Why GitHub's default is not enough

The `GET /repos/{owner}/{repo}/traffic/clones` and `.../traffic/views` endpoints always return **at most 14 days** of daily totals. The only way to build a longer history is to poll repeatedly and keep your own archive — exactly what the scheduled Action here does.

Referrers and popular-content endpoints are even more limited: they expose a rolling snapshot with **no per-day breakdown at all**. This project captures snapshots over time and labels them honestly rather than fabricating false lifetime numbers.

---

## ✦ Architecture

```
analytics-hub/                          ← this repo, fully self-contained
│
├── collector/                          ← Node.js + TypeScript
│   └── src/
│       ├── collect.ts                  ← entry point, orchestrates a full run
│       ├── github.ts                   ← thin fetch-based GitHub REST client
│       ├── merge.ts                    ← idempotent data merge (max, not add)
│       ├── types.ts                    ← canonical HistoryDataset schema
│       └── merge.test.ts               ← 3 unit tests for merge safety
│
├── dashboard/                          ← Vite + React + TypeScript + Tailwind + Recharts
│   └── src/
│       ├── App.tsx                     ← manifest-driven, multi-repo switcher
│       ├── lib/
│       │   ├── types.ts                ← dashboard types (mirrors collector schema)
│       │   ├── useManifest.ts          ← fetches manifest.json → repo list
│       │   ├── useHistoryData.ts       ← fetches per-repo history.json
│       │   ├── calculations.ts         ← pure analytics functions
│       │   └── export.ts               ← CSV / JSON download
│       └── components/
│           ├── Header.tsx              ← repo switcher, sync button, export
│           ├── RepoSwitcher.tsx        ← dropdown (hidden when 1 repo)
│           ├── TrafficChart.tsx        ← Recharts area chart
│           ├── GrowthInsights.tsx      ← period-over-period stats
│           ├── MetricCard.tsx          ← lifetime totals with growth badges
│           ├── TrafficSources.tsx      ← referrer snapshots
│           ├── PopularContent.tsx      ← top paths
│           └── RepoOverview.tsx        ← stars, forks, releases
│
├── data/                               ← committed dataset (source of truth)
│   ├── manifest.json                   ← auto-generated: list of tracked repos
│   └── <owner>-<repo>/
│       └── history.json                ← one file per tracked repo
│
└── .github/workflows/
    ├── collect.yml                     ← matrix job, runs every 6 h
    └── deploy.yml                      ← builds & publishes to Pages
```

**No backend server. No database.** The dataset is plain JSON, version-controlled, auditable via `git log`.

---

## ✦ Data integrity — why merging is safe to re-run

GitHub's traffic window for Aug 1–14 and the next window for Aug 2–15 both report **complete, authoritative totals** for the days they share — not deltas.

```
Snapshot A:  Aug 1→10  Aug 2→14  Aug 3→20
Snapshot B:            Aug 2→14  Aug 3→20  Aug 4→31
─────────────────────────────────────────────────────
Merged:      Aug 1→10  Aug 2→14  Aug 3→20  Aug 4→31  ✓
Not:         Aug 1→10  Aug 2→28  Aug 3→40  Aug 4→31  ✗ (would be wrong)
```

The merge rule is `max(existing, incoming)` per date — **never addition**. This makes every collection run safe to retry, reorder, or re-run from scratch. Covered by three unit tests in `collector/src/merge.test.ts`.

---

## ✦ Quick start — 5 minutes to live dashboard

### Step 1 — Create the hub repo

Create a **new empty GitHub repository** — call it something like `analytics-hub`. This is the only repo that gets modified; your tracked repos stay pristine.

```bash
# Clone this template into your new repo
git clone https://github.com/YOUR_USERNAME/Github-analyzer analytics-hub
cd analytics-hub
git remote set-url origin https://github.com/YOUR_USERNAME/analytics-hub
git push -u origin main
```

---

### Step 2 — Create a GitHub Personal Access Token

The token grants the **collector** read access to your target repos. It never touches the hub repo itself — the hub uses the built-in `GITHUB_TOKEN` to commit data back.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set **Resource owner** to your account (or org)
4. Under **Repository access** → select **Only select repositories** → pick every repo you want to track
5. Under **Permissions**, grant:
   - **Contents** → `Read and write`
   - **Administration** → `Read-only` *(required for traffic endpoints)*
6. Copy the generated token — you won't see it again

> **Classic PAT alternative:** Use the `repo` scope. Works fine, just broader than strictly needed.

---

### Step 3 — Add the token as a secret

In your **analytics-hub** repo:

**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `GH_ANALYTICS_TOKEN` | The PAT you just created |

---

### Step 4 — Tell the collector which repos to track

Open `.github/workflows/collect.yml` and edit the matrix list:

```yaml
strategy:
  matrix:
    repo:
      # ✏️ Replace with your real repos — one line each
      - YOUR_USERNAME/your-first-repo
      - YOUR_USERNAME/your-second-repo
      - ANOTHER_ORG/their-repo          # fine-grained PAT must cover this too
```

Save and push. That's it — the rest is automatic.

---

### Step 5 — Enable GitHub Pages

In your **analytics-hub** repo:

**Settings → Pages → Source → GitHub Actions**

> Leave the Branch field empty — the deploy workflow handles publishing directly.

---

### Step 6 — Run the workflows manually (first time)

1. **Actions → Collect repository analytics → Run workflow → Run workflow**
   - Wait for it to complete (~1–2 min). It will create `data/<slug>/history.json` for each repo and commit it.

2. **Actions → Deploy analytics dashboard → Run workflow → Run workflow**
   - Wait for it to complete (~1–2 min). It publishes the dashboard to Pages.

3. Your dashboard is live at:

```
https://YOUR_USERNAME.github.io/analytics-hub/
```

After this, everything is automatic — the collector runs every 6 hours and a deploy follows each successful collection.

---

## ✦ Adding more repos later

Just add another line to the matrix in `collect.yml`:

```yaml
matrix:
  repo:
    - YOUR_USERNAME/existing-repo
    - YOUR_USERNAME/new-repo          # ← add this
```

Make sure the PAT's repository access list includes the new repo. Push, and the next scheduled run (or a manual dispatch) picks it up automatically. The dashboard's repo-switcher gains the new entry without any frontend changes.

---

## ✦ Local development

```bash
# Install dependencies for both packages
npm run setup

# Copy the env template and fill in your token + a single test repo
cp .env.example collector/.env
# Edit collector/.env:
#   GH_ANALYTICS_TOKEN=ghp_...
#   GH_ANALYTICS_REPO=YOUR_USERNAME/your-repo
#   HISTORY_PATH=../data/YOUR_USERNAME-your-repo/history.json

# Pull real data
npm run collect

# Manually create a minimal manifest so the dashboard can load it
node -e "
const fs = require('fs');
const manifest = {
  schemaVersion: 1,
  repos: [{
    slug: 'YOUR_USERNAME/your-repo',
    dirName: 'YOUR_USERNAME-your-repo',
    dataPath: 'data/YOUR_USERNAME-your-repo/history.json'
  }]
};
fs.writeFileSync('data/manifest.json', JSON.stringify(manifest, null, 2));
console.log('manifest.json written');
"

# Copy data into dashboard's public folder for the dev server
cp data/manifest.json dashboard/public/manifest.json
mkdir -p dashboard/public/data/YOUR_USERNAME-your-repo
cp data/YOUR_USERNAME-your-repo/history.json dashboard/public/data/YOUR_USERNAME-your-repo/

# Start the dev server
npm run dev
# → http://localhost:5173/
```

> **No token?** You can put any well-formed `history.json` in `dashboard/public/data/<slug>/` — the dashboard renders entirely from that file with no live API calls.

---

## ✦ How data is stored

Everything lives in `data/`, committed to the hub repo like any other source file:

```jsonc
// data/manifest.json — auto-generated, lists all tracked repos
{
  "schemaVersion": 1,
  "repos": [
    {
      "slug":     "owner/repo",           // display name
      "dirName":  "owner-repo",           // filesystem-safe directory name
      "dataPath": "data/owner-repo/history.json"
    }
  ]
}

// data/owner-repo/history.json — one per tracked repo
{
  "schemaVersion": 1,
  "repository": {
    "fullName":      "owner/repo",
    "trackingSince": "2026-05-01T00:00:00.000Z",
    "language":      "TypeScript",
    "license":       "MIT"
    // ...
  },
  "lastSyncedAt":     "2026-08-09T13:42:00.000Z",
  "lastSyncStatus":   "ok",
  "daily": {
    "clones": { "2026-08-01": { "count": 12, "uniques": 9 }, ... },
    "views":  { "2026-08-01": { "count": 44, "uniques": 31 }, ... }
  },
  "repoStats":          [{ "date": "...", "stars": 128, "forks": 24, ... }],
  "releases":           [{ "tagName": "v1.0.0", "downloadCount": 312, ... }],
  "referrerSnapshots":  [{ "collectedAt": "...", "items": [...] }],
  "contentSnapshots":   [{ "collectedAt": "...", "items": [...] }]
}
```

The full schema is defined in `collector/src/types.ts` and mirrored in `dashboard/src/lib/types.ts`.

---

## ✦ How the GitHub Actions work

### `collect.yml` — runs every 6 hours

```
Trigger (schedule / manual)
  │
  ├─▶ [matrix: repo A]  collector → data/owner-repoA/history.json → upload artifact
  ├─▶ [matrix: repo B]  collector → data/owner-repoB/history.json → upload artifact
  └─▶ [matrix: repo C]  collector → data/owner-repoC/history.json → upload artifact
            (all three run in parallel, fail-fast: false)
                │
                ▼
  [commit job]  download all artifacts
                flatten into data/<slug>/
                regenerate data/manifest.json
                git commit + push  [skip ci]  (only if something changed)
```

### `deploy.yml` — triggers when `data/**` changes

```
[collect.yml commit] touches data/ → triggers deploy.yml
  │
  ▼
  Copy data/ tree into dashboard/public/data/
  Copy data/manifest.json → dashboard/public/manifest.json
  Vite build
  Upload Pages artifact
  deploy-pages action → live at https://you.github.io/analytics-hub/
```

---

## ✦ Required secrets & permissions

| Name | Where to add | Purpose |
|---|---|---|
| `GH_ANALYTICS_TOKEN` | Hub repo → Settings → Secrets → Actions | Read traffic data from each target repo |

The hub repo uses the built-in `GITHUB_TOKEN` (automatically available in every Action) to commit the data files back — **no extra secret needed for that step**.

### Token permissions reference

| Permission | Level | Why |
|---|---|---|
| Contents | Read and write | Fetch repo metadata; write `history.json` locally during collection |
| Administration | Read-only | Traffic endpoints (`/traffic/clones`, `/traffic/views`) require push access to the target repo |

---

## ✦ Limitations & data accuracy

**Tracking starts when you start it.**
Lifetime totals only cover data collected since the first successful run. The dashboard states this clearly and never implies pre-tracking history exists.

**Referrers and popular content have no true history.**
GitHub only returns the current rolling window for these (no per-day breakdown), so they can't be merged into a lifetime series. The dashboard shows the most recently collected snapshot, labeled as such.

**"Unique" is per-window, not globally deduplicated.**
GitHub's unique-cloner/visitor counts are unique within each 14-day window, not across your entire history. Summing daily uniques is the best available approximation but will double-count the same person across different windows — this is a GitHub API constraint.

**Clone/view counts may include automated traffic.**
CI systems, mirrors, and bots all count. GitHub provides no way to distinguish them from humans.

**Star/fork/watcher history is sampled, not exact-timestamped.**
GitHub doesn't expose cheap historical star counts, so repo-level counters are recorded once per UTC day at collection time.

---

## ✦ Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Dashboard shows "No repos tracked yet" | Collector hasn't run / matrix is still a placeholder | Fill in the matrix in `collect.yml`, run the workflow manually |
| Dashboard shows "We're collecting your first dataset" | Collector ran but got no data yet | Wait for the next scheduled run or trigger manually; check Action logs |
| Collector fails: authentication error | Token missing, expired, or wrong scope | Regenerate `GH_ANALYTICS_TOKEN`; check Administration: Read-only is granted |
| Collector fails: rate-limit error | Too many API calls in a short window | The next scheduled run will succeed; this is safe to wait out |
| Referrers / popular content empty | Token lacks write access to target repo, or repo has no recent traffic | Confirm Administration: Read-only is granted on each target repo |
| Dashboard deployed but shows stale data | `deploy.yml` didn't fire after last data commit | Trigger it manually from the Actions tab |
| Repo switcher not showing | Only one repo in the manifest | Normal — the switcher is intentionally hidden for single-repo setups |
| 404 on the Pages URL | Pages source not set to "GitHub Actions" | Settings → Pages → Source → GitHub Actions, re-run `deploy.yml` |
| `HISTORY_PATH` is wrong locally | Mismatch between env value and actual directory | Make sure `HISTORY_PATH` matches `data/<owner>-<repo>/history.json` |

---

## ✦ Security

- The token is read only from `process.env` inside the Action's runtime.
- It is **never** written into `data/*/history.json`, `data/manifest.json`, the dashboard JS bundle, or any log output.
- The dashboard is a **static site** with no server and no token — it only reads the public JSON files already committed to the repo.
- `.gitignore` excludes `.env`, `.env.local`, and `*.env` files.
- `.env.example` documents required variables without real values — safe to commit.

---

## ✦ Project structure

```
analytics-hub/
├── .env.example                   ← env variable reference (commit-safe)
├── .gitignore
├── package.json                   ← root scripts: setup, collect, dev, build, test
│
├── .github/
│   └── workflows/
│       ├── collect.yml            ← matrix collection, every 6 h
│       └── deploy.yml             ← Pages deploy, triggers on data/** changes
│
├── collector/                     ← npm package (Node 20+, TypeScript, tsx)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── collect.ts             ← orchestrates one full collection run
│       ├── github.ts              ← REST API client (plain fetch, no extra deps)
│       ├── merge.ts               ← idempotent merge: max(), not add()
│       ├── types.ts               ← HistoryDataset schema (single source of truth)
│       └── merge.test.ts          ← 3 unit tests (node:test)
│
├── dashboard/                     ← npm package (Vite 6, React 19, Tailwind 3)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── lib/
│       │   ├── types.ts           ← mirrors collector schema (independent build)
│       │   ├── useManifest.ts     ← fetches manifest.json
│       │   ├── useHistoryData.ts  ← fetches per-repo history.json
│       │   ├── calculations.ts    ← pure analytics (timeline, growth, peaks)
│       │   └── export.ts          ← CSV + JSON download
│       └── components/
│           ├── Header.tsx
│           ├── RepoSwitcher.tsx
│           ├── TrafficChart.tsx
│           ├── GrowthInsights.tsx
│           ├── MetricCard.tsx
│           ├── TrafficSources.tsx
│           ├── PopularContent.tsx
│           ├── Panel.tsx
│           ├── Selectors.tsx
│           ├── CountUp.tsx
│           └── States.tsx
│
└── data/
    ├── manifest.json              ← auto-generated, do not edit by hand
    └── <owner>-<repo>/
        └── history.json           ← one per tracked repo, grows over time
```

---

## ✦ Available scripts

All run from the repo root:

| Command | What it does |
|---|---|
| `npm run setup` | `npm ci` in both `collector/` and `dashboard/` |
| `npm run collect` | Run one collection cycle (requires `collector/.env`) |
| `npm run dev` | Start the Vite dashboard dev server |
| `npm run build` | Build the dashboard production bundle |
| `npm run test` | Run collector unit tests (`node:test`) |
| `npm run typecheck` | TypeScript check across both packages |

---

## ✦ License

MIT — do whatever you want with it. A credit back is appreciated but not required.
