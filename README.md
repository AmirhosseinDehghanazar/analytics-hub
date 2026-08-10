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

**A self-hosted, multi-provider repository analytics hub — track all your GitHub & GitLab repositories in one unified, lifetime archive with zero clutter in target repos.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-E8A840?style=for-the-badge&logo=github)](https://amirhosseindehghanazar.github.io/analytics-hub/)
[![Tests](https://img.shields.io/badge/tests-7%2F7%20passing-brightgreen?style=flat-square&logo=node.js)](collector/src/provider.test.ts)
[![Providers](https://img.shields.io/badge/Providers-GitHub%20%7C%20GitLab-orange?style=flat-square)](collector/src/providers)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](tsconfig.json)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](#-license)

</div>

---

## ✦ What is Analytics Hub?

Repository providers like GitHub and GitLab limit traffic retention windows or omit long-term historical analytics archives.

**Analytics Hub** solves this problem by creating a self-hosted, automated provider-independent analytics engine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            TARGET REPOSITORIES                              │
│       (GitHub Repo A)       (GitHub Repo B)        (GitLab Project C)       │
│            │                       │                       │                │
│            └───────────────────────┼───────────────────────┘                │
│                                    │                                        │
│                 GitHub REST & GitLab REST API Clients                       │
│                                    │                                        │
│                                    ▼                                        │
│                      ┌───────────────────────────┐                          │
│                      │   COLLECTOR ACTION (CI)   │                          │
│                      │  (Parallel Matrix Runner) │                          │
│                      └─────────────┬─────────────┘                          │
│                                    │                                        │
│                            git commit data/                                 │
│                                    │                                        │
│                                    ▼                                        │
│                      ┌───────────────────────────┐                          │
│                      │    DASHBOARD (Vite/React) │                          │
│                      │ Multi-Provider & Filter   │                          │
│                      └─────────────┬─────────────┘                          │
│                                    │                                        │
│                               GitHub Pages                                  │
│               https://your-username.github.io/analytics-hub/               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **100% Clean Target Repos**: Your tracked repositories need **zero workflow files**, zero configuration, and zero code added to them. The Hub operates completely standalone via provider REST APIs.

---

## 🦊 Supported Providers & Capability Matrix

Analytics Hub natively supports **GitHub** and **GitLab** projects in the same instance:

| Metric / Feature | GitHub | GitLab | Provider Endpoint / Notes |
|---|:---:|:---:|---|
| **Stars** | ✅ | ✅ | GitHub `/repos/:owner/:repo`, GitLab `/projects/:id` (`star_count`) |
| **Forks** | ✅ | ✅ | GitHub `forks_count`, GitLab `forks_count` |
| **Open Issues** | ✅ | ✅ | GitHub `open_issues_count`, GitLab `open_issues_count` |
| **Pull / Merge Requests** | ✅ | ✅ | GitHub PRs (`search/issues?q=type:pr`), GitLab Open MRs (`/merge_requests?state=opened`) |
| **Releases** | ✅ | ✅ | GitHub `/releases`, GitLab `/releases` |
| **Daily Clones / Fetches** | ✅ | ✅ | GitHub `/traffic/clones`, GitLab `/statistics` (`fetches.days`) |
| **Unique Cloners** | ✅ | ❌ | GitHub exposes unique cloners; GitLab exposes total fetch count |
| **Daily Page Views** | ✅ | ❌ | GitHub exposes page views traffic; GitLab public REST API omits daily page views |
| **Traffic Referrers & Content**| ✅ | ❌ | GitHub exposes traffic endpoints; GitLab REST API omits referrer logs |
| **Stargazer Avatars & History** | ✅ | ✅ | Both exposes `star+json` media type; |

---

## ⚡ Key Features

- 🌐 **"All Repositories" Aggregated Mode**: View combined clones, views, stargazers, referrers, and activity metrics across all GitHub & GitLab repositories in one single view.
- 🦊 **Provider Filter Tabs & Badges**: Seamlessly filter repository dropdown by `All`, `GitHub`, or `GitLab` with visual provider badges.
- 📦 **Single Repository Deep-Dive**: Pick any specific repository from the custom popover dropdown selector.
- ⭐ **Stargazer Avatar Wall**: Displays an interactive wall of users who starred your GitHub repositories with staggered pop-in animations.
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

### Step 2: Configure Provider Authentication Tokens

#### GitHub Token (`GH_ANALYTICS_TOKEN`)
1. Open GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
2. Set **Repository permissions**:
   - **Contents**: `Read and write`
   - **Administration**: `Read-only` *(Required by GitHub for traffic endpoints)*
3. Copy token (`github_pat_...`).

#### GitLab Token (`GITLAB_ANALYTICS_TOKEN`) *(Optional if tracking GitLab repos)*
1. Open GitLab → **User Settings** → **Access Tokens** (or **Project Access Tokens**).
2. Create token with **Scopes**: `read_api` (or `api`).
3. Copy token (`glpat-...`).

---

### Step 3: Add Tokens as GitHub Secrets

In your `analytics-hub` repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**:
   - Name: `GH_ANALYTICS_TOKEN` → Value: Your GitHub token
   - Name: `GITLAB_ANALYTICS_TOKEN` → Value: Your GitLab token

---

### Step 4: Configure Your Repositories List

Open `.github/workflows/collect.yml` and list your target repositories with their provider:

```yaml
strategy:
  fail-fast: false
  matrix:
    target:
      # GitHub repositories (format: owner/repo)
      - provider: github
        repo: YOUR_USERNAME/your-first-repo
      - provider: github
        repo: YOUR_USERNAME/your-second-repo

      # GitLab repositories (format: group/project or group/subgroup/project)
      - provider: gitlab
        repo: gitlab-org/gitlab-runner
```

Save and push to `main`.

---

### Step 5: Enable GitHub Pages & Trigger First Run

In your `analytics-hub` repository:
1. Go to **Settings** → **Pages** → under **Build and deployment → Source**, select **GitHub Actions**.
2. Go to the **Actions** tab → select **Collect repository analytics** → click **Run workflow**.

Your dashboard will be live at:

```
https://YOUR_USERNAME.github.io/analytics-hub/
```

Everything operates **100% automatically** on a scheduled cron timer!

---

## 🛠️ Local Development & Commands

Run all scripts from the repository root:

```bash
# 1. Install dependencies for both packages
npm run setup

# 2. Run unit tests across collector providers and merge functions
npm run test

# 3. Run TypeScript typecheck across all packages
npm run typecheck

# 4. Start local Vite dashboard server
npm run dev

# 5. Build production Vite dashboard bundle
npm run build
```

---

## 📂 Data Format & Persisted Schema (`data/`)

Historical datasets are saved as version-controlled JSON files under `data/`:

```json
{
  "schemaVersion": 1,
  "provider": "github",
  "repository": {
    "provider": "github",
    "owner": "AmirhosseinDehghanazar",
    "name": "analytics-hub",
    "fullName": "AmirhosseinDehghanazar/analytics-hub",
    "htmlUrl": "https://github.com/AmirhosseinDehghanazar/analytics-hub"
  },
  "lastSyncedAt": "2026-08-09T18:00:00.000Z",
  "lastSyncStatus": "ok",
  "daily": {
    "clones": { "2026-08-01": { "count": 24, "uniques": 18 } },
    "views": { "2026-08-01": { "count": 142, "uniques": 89 } }
  },
  "repoStats": [ { "date": "2026-08-01", "stars": 42, "forks": 12, "openPRs": 3 } ],
  "stargazers": [ { "login": "octocat", "avatarUrl": "...", "starredAt": "..." } ]
}
```

---

## 🔒 Security & Privacy Guarantees

> [!IMPORTANT]
> **Zero Token Leakage & 100% Read-Only Web Interface**
> Your Personal Access Tokens (`GH_ANALYTICS_TOKEN`, `GITLAB_ANALYTICS_TOKEN`) are used **exclusively inside GitHub's encrypted Actions runners**. They are never exposed in client JS bundles, never written to dataset JSON files, and never sent to any third-party server.

| Security Pillar | Guarantee |
|---|---|
| 🔐 **Encrypted Token Vault** | Provider tokens live strictly in GitHub Secrets (`Settings → Secrets → Actions`). They are read inside GitHub's isolated Linux runner VMs and never exposed publicly. |
| 🌐 **100% Static & Read-Only** | The published GitHub Pages dashboard is a pure static single-page application (SPA). It has **no backend server, no database, and zero administrative write permissions**. |
| 🙈 **Zero Code / File Storage** | The `data/` directory only contains aggregated numerical counts (clones, views, star counts, referrer domains) and public stargazer avatars. Your source code files, commit histories, and private data are **never stored or accessed**. |
| 🎯 **Minimum Scope Isolation** | Scoped exclusively to the specific target repositories you choose with strictly minimum necessary permissions (`read_api` for GitLab, `Contents: Read/Write`, `Administration: Read-only` for GitHub). |
| 🚫 **No Third-Party Telemetry** | Zero Google Analytics, zero ad trackers, zero telemetry scripts. All browser requests go exclusively to your own GitHub Pages domain and public APIs for user avatars. |
| 🛡️ **`.gitignore` Safety Net** | Strict gitignore rules prevent local `.env` configuration files or secret tokens from ever being accidentally committed to Git. |

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
