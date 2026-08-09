<div align="center">

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██████╗ ███████╗██████╗  ██████╗                                       ║
║   ██╔══██╗██╔════╝██╔══██╗██╔═══██╗                                      ║
║   ██████╔╝█████╗  ██████╔╝██║   ██║                                      ║
║   ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║                                      ║
║   ██║  ██║███████╗██║     ╚██████╔╝  A N A L Y T I C S   H U B           ║
║   ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**A lifetime, multi-repo GitHub traffic & stargazer analytics hub — track all your repositories in one place with zero clutter in the target repos.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-E8A840?style=for-the-badge&logo=github)](https://amirhosseindehghanazar.github.io/analytics-hub/)
[![Tests](https://img.shields.io/badge/tests-3%2F3%20passing-brightgreen?style=flat-square&logo=node.js)](collector/src/merge.test.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](tsconfig.json)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](#-license)

</div>

---

## ✦ What is Analytics Hub?

GitHub's built-in Traffic tab **permanently deletes traffic data older than 14 days**. There is no archive, no export, and no lifetime overview.

**Analytics Hub** solves this problem by creating a self-hosted, automated analytics engine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            TARGET REPOSITORIES                              │
│         (Repo A)             (Repo B)             (Repo C)                  │
│            │                    │                    │                      │
│            └────────────────────┼────────────────────┘                      │
│                                 │                                           │
│                     GitHub REST Traffic & Star APIs                         │
│                                 │                                           │
│                                 ▼                                           │
│                   ┌───────────────────────────┐                             │
│                   │   COLLECTOR ACTION (CI)   │                             │
│                   │  (Parallel Matrix Runner) │                             │
│                   └─────────────┬─────────────┘                             │
│                                 │                                           │
│                         git commit data/                                    │
│                                 │                                           │
│                                 ▼                                           │
│                   ┌───────────────────────────┐                             │
│                   │    DASHBOARD (Vite/React) │                             │
│                   │ Single & Aggregate Views  │                             │
│                   └─────────────┬─────────────┘                             │
│                                 │                                           │
│                            GitHub Pages                                     │
│            https://your-username.github.io/analytics-hub/                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **100% Clean Target Repos**: Your tracked repositories need **zero workflow files**, zero configuration, and zero code added to them. The Hub operates completely standalone via the GitHub API.

---

## ⚡ Key Features

- 🌐 **"All Repositories" Aggregated Mode**: View combined clones, views, stargazers, referrers, and activity metrics across all your repositories in one single view.
- 📦 **Single Repository Deep-Dive**: Pick any specific repository from the custom popover dropdown selector.
- ⭐ **Stargazer Avatar Wall**: Displays an interactive wall of users who starred your repositories with staggered pop-in animations.
- 👤 **Interactive Profile Slide-in Modal**: Click any stargazer's avatar to launch a modal fetching their bio, location, company, website, followers, public repos, and star date.
- 📈 **Lifetime Traffic Charts**: Interactive Recharts timeline with range switching (7D, 14D, 30D, 90D, 6M, 1Y, ALL) and metric toggles (Clones, Unique Cloners, Views, Unique Visitors).
- 📊 **Period-Over-Period Growth**: Automatic 7-day, 30-day, and 90-day growth comparisons and peak day/month detection.
- 🛡️ **Idempotent Data Merging**: Uses mathematical `max()` merging so repeated workflow runs never double-count daily traffic.
- 📥 **One-Click Export**: Export daily timeline data to CSV or JSON format on demand.
- 🎨 **Glassmorphism Aesthetic**: Modern dark UI built with Tailwind CSS, custom notch architectural panels, and subtle micro-animations.

---

## ✦ Quick Start — Setup Guide (5 Minutes)

### Step 1: Fork or Clone this Repository

Create your own `analytics-hub` repository on GitHub:

```bash
git clone https://github.com/AmirhosseinDehghanazar/analytics-hub.git analytics-hub
cd analytics-hub
git remote set-url origin https://github.com/YOUR_USERNAME/analytics-hub.git
git push -u origin main
```

---

### Step 2: Create a GitHub Personal Access Token (PAT)

The collector workflow needs a Fine-grained Personal Access Token to read traffic data from your target repos:

1. Open GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
2. Click **Generate new token**.
3. Set **Token name** to `Analytics Hub Token`.
4. Under **Repository access** → select **Only select repositories** → pick all the target repositories you want to track.
5. Under **Permissions** → expand **Repository permissions**:
   - **Contents**: `Read and write`
   - **Administration**: `Read-only` *(Required by GitHub to access traffic endpoints)*
6. Click **Generate token** and copy the token string (`github_pat_...`).

---

### Step 3: Add the Token as a GitHub Secret

In your `analytics-hub` repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Set **Name** to `GH_ANALYTICS_TOKEN`.
4. Set **Secret** to your copied token string.
5. Click **Add secret**.

---

### Step 4: Configure Your Repositories List

Open `.github/workflows/collect.yml` and list the repositories you want to track:

```yaml
strategy:
  fail-fast: false
  matrix:
    repo:
      - YOUR_USERNAME/your-first-repo
      - YOUR_USERNAME/your-second-repo
      - YOUR_USERNAME/your-third-repo
```

Save and push to `main`.

---

### Step 5: Enable GitHub Pages

In your `analytics-hub` repository:
1. Go to **Settings** → **Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.

---

### Step 6: Trigger the First Run

Go to the **Actions** tab in your repository:
1. Select **Collect repository analytics** → click **Run workflow** → **Run workflow**.
2. Once complete, your dashboard will be live at:

```
https://YOUR_USERNAME.github.io/analytics-hub/
```

After this first run, everything operates **100% automatically** on a scheduled cron timer!

---

## 🛠️ Local Development & Commands

Run all scripts from the repository root:

```bash
# 1. Install dependencies for both packages
npm run setup

# 2. Configure local environment (for collector)
cp .env.example collector/.env
# Add GH_ANALYTICS_TOKEN and GH_ANALYTICS_REPO to collector/.env

# 3. Run unit tests
npm run test

# 4. Run TypeScript typecheck across all packages
npm run typecheck

# 5. Start Vite dashboard dev server
npm run dev

# 6. Build production bundle
npm run build
```

---

## 📐 Data Structure & Storage

All datasets are stored in plain, version-controlled JSON inside the `data/` directory:

```jsonc
// data/manifest.json — Registry of all tracked repos
{
  "schemaVersion": 1,
  "repos": [
    {
      "slug": "YOUR_USERNAME/your-repo",
      "dirName": "YOUR_USERNAME-your-repo",
      "dataPath": "data/YOUR_USERNAME-your-repo/history.json"
    }
  ]
}

// data/YOUR_USERNAME-your-repo/history.json — Lifetime dataset
{
  "schemaVersion": 1,
  "repository": { ... },
  "lastSyncedAt": "2026-08-09T18:00:00.000Z",
  "lastSyncStatus": "ok",
  "daily": {
    "clones": { "2026-08-01": { "count": 24, "uniques": 18 } },
    "views": { "2026-08-01": { "count": 142, "uniques": 89 } }
  },
  "repoStats": [ { "date": "2026-08-01", "stars": 42, "forks": 12 } ],
  "stargazers": [ { "login": "octocat", "avatarUrl": "...", "starredAt": "..." } ]
}
```

---

## 🔒 Security & Privacy

- **Zero Token Leakage**: The `GH_ANALYTICS_TOKEN` secret is accessed strictly inside GitHub Actions server runners. It is **never** written into JSON data files or included in the frontend JS bundle.
- **Static & Client-Side**: The dashboard is a 100% static site hosted on GitHub Pages with no backend server or database required.
- **Public Profile API**: The stargazer profile modal uses GitHub's public `/users/:login` REST endpoint client-side without requiring authentication.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
