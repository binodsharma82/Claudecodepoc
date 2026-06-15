# IQ2020 POC — Claude Code Guide

Commercial pharma field-rep analytics dashboard modelled on IQVIA IQ2020.  
Fictional company: **PharmaCore Inc** | Products: NEXOLID, VERITONEX, CLAROZEPT, DEPTRAZOL (CNS/Psychiatry).

---

## What This Is

A full-stack POC demonstrating IQ2020-style field-rep analytics:
- Executive summary KPIs and trend charts
- Territory performance rankings
- HCP Tracker with decile/segment filtering and prescriber profiles
- Active alerts (missed calls, declining TRx, target gaps)
- Speaker bureau management
- Vaccines BU dashboard

Built as **React 18 SPA + Flask REST API**. A legacy **FastAPI monolith** is preserved alongside it untouched.

---

## How to Run

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
| Styling | CSS custom properties, mobile-first |
| Backend (new) | Python Flask 3, flask-cors |
| Backend (legacy) | Python FastAPI |
| Data access | pandas DataFrames, openpyxl |
| Data source | 10 Excel files in `sourcedata/` |
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
│   ├── app.py                ← Flask API (11 endpoints, port 5000)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           ← Router root, 7 routes
│   │   ├── index.css         ← IQ2020 design tokens + layout
│   │   ├── api/client.js     ← Typed fetch wrapper
│   │   ├── context/AppContext.jsx  ← Global: territory, period, BU
│   │   ├── components/
│   │   │   ├── Layout/       ← Header, TabNav, BottomNav
│   │   │   └── KPICard.jsx
│   │   ├── pages/
│   │   │   ├── Executive.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── HCPTracker.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── Speakers.jsx
│   │   │   └── Vaccines.jsx
│   │   └── assets/gsk1.png
│   ├── vite.config.js        ← proxy /api → :5000, host 127.0.0.1
│   └── package.json
│
├── sourcedata/               ← 10 Excel files (synthetic data)
│   ├── Dim_Territory.xlsx
│   ├── Dim_Products.xlsx
│   ├── Dim_MasterCustomer.xlsx
│   ├── Dim_SalesRep.xlsx
│   ├── Dim_Speaker.xlsx
│   ├── Fact_Calls.xlsx
│   ├── Fact_Prescriptions.xlsx
│   ├── Fact_SalesTarget.xlsx
│   ├── KPI_Territory.xlsx
│   ├── KPI_HCP360.xlsx
│   └── IQ2020_POC_DataModel.xlsx
│
├── generate_sample_data.py   ← Regenerates all xlsx files
├── references/               ← IQ2020 fact sheet, GSK brand assets
├── docs/                     ← Decision logs
├── run_backend.bat
├── run_frontend.bat
└── venv/
```

---

## API Endpoints (Flask :5000)

All accept `?territory=ALL&period=2025-06` query params.

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/territories` | Territory list |
| GET | `/api/kpis` | 8 executive KPIs |
| GET | `/api/trend` | 6-month TRx/NRx trend |
| GET | `/api/territory-perf` | Territory ranking table |
| GET | `/api/product-share` | Portfolio share |
| GET | `/api/payer-mix` | Payer channel breakdown |
| GET | `/api/hcp-tracker` | HCP list with metrics |
| GET | `/api/hcp/:cid` | Single HCP profile |
| GET | `/api/decile` | Decile distribution |
| GET | `/api/alerts` | Prioritised alerts |
| GET | `/api/speakers` | Speaker bureau roster |
| GET | `/api/vaccines` | Vaccines coverage + trend |

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
- [ ] **Authentication** — Azure AD SSO (MSAL), role-based tab visibility
- [ ] **Write-back actions** — schedule calls, flag HCPs, dismiss alerts (needs PostgreSQL)
- [ ] **AI Assistant panel** — Azure OpenAI Agents SDK, voice input (Mic icon wired)
- [ ] **Production build** — `npm run build` → Flask serves `frontend/dist/`; single process
- [ ] **Admin config** — territory/rep assignments without code changes
- [ ] **Unit tests** — pytest for Flask endpoints, Vitest for React components

---

## Key Constraints

- `app.py`, `templates/index.html`, `run_dashboard.bat` — **never modify**, legacy reference
- Data range: Jan 2025 – Jun 2025 synthetic data only
- BU selector (`AIR` / `SBU` / `Vaccines`) controls which tabs are visible — each tab declares its allowed BUs
- Vite must use `host: '127.0.0.1'` (not `localhost`) on Windows — Node.js 17+ resolves `localhost` to `::1`
