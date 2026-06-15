# IQ2020 POC — Claude Code Guide

Commercial pharma field-rep analytics dashboard modelled on IQVIA IQ2020.  
App name: **Pharma CTED - Field Tech** | Products: NEXOLID, VERITONEX, CLAROZEPT, DEPTRAZOL (CNS/Psychiatry).

---

## What This Is

A full-stack POC demonstrating IQ2020-style field-rep analytics:
- Executive summary KPIs and trend charts
- Territory performance rankings
- HCP Tracker with decile/segment filtering and prescriber profiles
- Active alerts (missed calls, declining TRx, target gaps)
- Speaker bureau management
- Vaccines BU dashboard
- Session-based authentication and BU/territory authorization

Built as **React 18 SPA + Flask REST API**. A legacy **FastAPI monolith** is preserved alongside it untouched.

---

## Live Deployment

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://frontend-iqtestbinod.vercel.app |
| **Backend API (Render)** | https://iq2020-poc-api.onrender.com |
| **GitHub Repo** | https://github.com/binodsharma82/Claudecodepoc |
| **Render Dashboard** | https://dashboard.render.com/web/srv-d8o3l536sc1c73cot1dg |
| **Vercel Dashboard** | https://vercel.com/iqtestbinod/frontend |

> Render free tier sleeps after 15 min idle — first API call after inactivity takes ~30s to wake.

### Redeploy (after pushing to GitHub)

```bash
# Frontend — from project root
cd frontend && npx vercel --prod --yes

# Backend — trigger via Render API
curl -X POST https://api.render.com/v1/services/srv-d8o3l536sc1c73cot1dg/deploys \
  -H "Authorization: Bearer <RENDER_API_KEY>"
```

---

## How to Run Locally

### Prerequisites
- Python venv already set up at `venv/`
- Node 18+ with npm installed

### Start the Flask API (terminal 1)
```
run_backend.bat
```
Flask runs on `http://localhost:5000`

### Start the React dev server (terminal 2)
```
run_frontend.bat
```
Vite runs on `http://localhost:3000`  
All `/api/*` requests are proxied to `:5000` — no CORS config needed.

### Legacy FastAPI dashboard
```
run_dashboard.bat
```
Runs on `http://localhost:8000` — original single-HTML app, untouched.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 8, React Router v6 |
| Charts | Recharts (Area, Line, Bar, Pie) |
| Icons | lucide-react |
| Styling | CSS custom properties + Tailwind, mobile-first |
| Backend (new) | Python Flask 3, flask-cors |
| Backend (legacy) | Python FastAPI |
| Data access | pandas DataFrames, openpyxl |
| Data source | 10 Excel files in `sourcedata/` |
| Hosting | Vercel (frontend) + Render free tier (backend) |
| Runtime | Python venv, Node.js |

---

## Folder Structure

```
IQ2020_POC/
├── app.py                    ← LEGACY FastAPI — DO NOT TOUCH
├── templates/index.html      ← LEGACY HTML dashboard — DO NOT TOUCH
├── run_dashboard.bat         ← LEGACY startup — DO NOT TOUCH
│
├── backend/
│   ├── app.py                ← Flask API (auth + 13 endpoints, port 5000)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           ← Router root, 7 routes + ProtectedRoute
│   │   ├── index.css         ← IQ2020 design tokens + layout
│   │   ├── api/client.js     ← Fetch wrapper — passes ?bu=, ?territory=, ?period= on every call
│   │   ├── context/
│   │   │   ├── AppContext.jsx  ← Global: territory, period, bu, allowedBus
│   │   │   └── AuthContext.jsx ← User session (localStorage), login/logout
│   │   ├── components/
│   │   │   ├── Layout/       ← Header (BU pills filtered to user.bus), TabNav, BottomNav
│   │   │   └── KPICard.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Executive.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── HCPTracker.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── Speakers.jsx
│   │   │   └── Vaccines.jsx
│   │   └── assets/
│   ├── vercel.json           ← SPA catch-all + /api/* rewrite to Render
│   ├── vite.config.js        ← proxy /api → :5000, host 127.0.0.1
│   └── package.json
│
├── sourcedata/               ← 10 Excel files (synthetic data)
│   ├── Dim_Territory.xlsx
│   ├── Dim_Products.xlsx
│   ├── Dim_MasterCustomer.xlsx
│   ├── Dim_SalesRep.xlsx
│   ├── Dim_Speaker.xlsx
│   ├── Fact_Calls.xlsx       ← has TerritoryID — used for rep call filtering
│   ├── Fact_Prescriptions.xlsx
│   ├── Fact_SalesTarget.xlsx
│   ├── KPI_Territory.xlsx
│   ├── KPI_HCP360.xlsx
│   └── IQ2020_POC_DataModel.xlsx
│
├── requirements.txt          ← Root: Flask deps + gunicorn (for Render)
├── render.yaml               ← Render free-tier web service config
├── generate_sample_data.py   ← Regenerates all xlsx files
├── references/               ← IQ2020 fact sheet, GSK brand assets
├── docs/                     ← Decision logs
├── run_backend.bat
├── run_frontend.bat
└── venv/
```

---

## API Endpoints (Flask :5000)

All data endpoints accept `?territory=ALL&period=2025-06&bu=AIR` query params.  
`bu` is required for BU-level filtering — passed automatically by `client.js` from AppContext.

| Method | Path | Returns |
|--------|------|---------|
| POST | `/api/auth/login` | Authenticates user, sets Flask session cookie |
| POST | `/api/auth/logout` | Clears session |
| GET | `/api/auth/users` | Demo credential list for login panel |
| GET | `/api/territories` | Territory list |
| GET | `/api/kpis` | 8 executive KPIs |
| GET | `/api/trend` | 6-month TRx/NRx trend (products filtered by BU) |
| GET | `/api/territory-perf` | Territory ranking table |
| GET | `/api/product-share` | Portfolio share (filtered by BU) |
| GET | `/api/payer-mix` | Payer channel breakdown |
| GET | `/api/hcp-tracker` | HCP list filtered by territory + BU specialty |
| GET | `/api/hcp/:cid` | Single HCP profile (calls filtered to rep's territory) |
| GET | `/api/hcp-concentration` | Pareto/decile curve (filtered by BU specialty) |
| GET | `/api/decile` | Decile distribution |
| GET | `/api/alerts` | Alerts filtered by territory + BU specialty |
| GET | `/api/speakers` | Speaker roster filtered by BU certified products |
| GET | `/api/vaccines` | Vaccines coverage + trend (Vaccines BU only) |

---

## Authentication & Authorization

### Session mechanism
Login sets a signed Flask session cookie. Since all `/api/*` calls go through Vercel's proxy (same origin from the browser's perspective), the browser automatically sends the cookie on every request — no auth headers needed in the frontend.

### Demo users (POC only)

| Username | Password | Role | Territory | BUs |
|----------|----------|------|-----------|-----|
| `jsmith` | `Pass1234` | Field Rep | T001 | AIR |
| `rlee` | `Pass1234` | Field Rep | T002 | SBU |
| `schen` | `Pass1234` | Field Rep | T003 | AIR, SBU |
| `mjones` | `Pass1234` | Dist Manager | ALL | AIR, SBU, Vaccines |
| `admin` | `Admin123` | Admin | ALL | AIR, SBU, Vaccines |

### Authorization rules (enforced server-side)

**Territory:**
- Field Reps → locked to their own territory regardless of `?territory=` param
- Dist Managers / Admins → can select any territory

**BU & Products:**

| BU | Products | HCP Specialties |
|----|----------|-----------------|
| AIR | NEXOLID, VERITONEX | Neurology, Oncology |
| SBU | CLAROZEPT, DEPTRAZOL | Psychiatry, Internal Medicine, Geriatrics |
| Vaccines | (none — own endpoint) | Family Practice, Cardiology |

> Specialties are **exclusive** — no specialty appears in more than one BU, ensuring HCP pools and TRx figures are fully separated. HCP-level TRx/NRx in all endpoints uses per-product columns (`NEXOLID_TRx_CM`, `CLAROZEPT_TRx_CM`, etc.) rather than `CM_Total_TRx` so BU switching produces distinct numbers even for HCPs who prescribe across product lines.

- Field Reps → only see BU pills they are assigned to; data filtered by selected BU
- Multi-BU reps (e.g. `schen`) → see both AIR and SBU pills; switching changes all data
- `/api/vaccines` → returns 403 for non-Vaccines-BU reps

### Key backend helpers (`backend/app.py`)
- `_session_user()` — reads authenticated user from Flask session
- `_enforce_territory(requested)` — clamps reps to their territory
- `_resolve_bu()` — resolves effective BU from `?bu=` param, clamped to user's authorised list
- `_effective_products()` — product set for current BU × user's auth
- `_effective_specialties()` — specialty set for current BU × user's auth

---

## BU Selector — Frontend Flow

1. `AppContext` initialises `bu` to the user's first authorised BU (`user.bus[0]`)
2. `Header` filters BU pills to `allowedBus` from AppContext (derived from `user.bus`)
3. When a BU pill is clicked, `setBu()` triggers re-renders in all pages
4. Every page has `bu` in its `useEffect` dependency array and passes it in API calls
5. `client.js` includes `bu` in every GET request's query string

---

## Design Tokens

```css
--bg:        #07111f   /* page background */
--bg-card:   #0f2040   /* card background */
--blue:      #1e68d4   /* primary / NEXOLID */
--orange:    #F36F21   /* GSK brand / VERITONEX */
--green:     #22c55e   /* positive delta / CLAROZEPT */
--red:       #ef4444   /* negative / alerts */
--purple:    #a855f7   /* DEPTRAZOL */
```

---

## What's Coming Next

- [ ] **Real IQVIA data connector** — swap pandas Excel loader for IQ2020 REST/SFTP feed
- [ ] **Azure AD SSO** — replace demo USERS dict with MSAL authentication
- [ ] **Write-back actions** — schedule calls, flag HCPs, dismiss alerts (needs PostgreSQL)
- [ ] **AI Assistant panel** — Azure OpenAI Agents SDK, voice input (Mic icon wired)
- [ ] **Admin config** — territory/rep/BU assignments without code changes
- [ ] **Unit tests** — pytest for Flask endpoints, Vitest for React components

---

## Key Constraints

- `app.py`, `templates/index.html`, `run_dashboard.bat` — **never modify**, legacy reference
- `backend/requirements.txt` — do not modify; root `requirements.txt` is used by Render
- Data range: Jan 2025 – Jun 2025 synthetic data only
- `SECRET_KEY` env var must be set on Render for stable sessions (auto-generated via `render.yaml`)
- Vite must use `host: '127.0.0.1'` (not `localhost`) on Windows — Node.js 17+ resolves `localhost` to `::1`
- `SESSION_COOKIE_SECURE=True` in Flask — local dev runs in no-auth fallback mode (HTTP, no cookie)
