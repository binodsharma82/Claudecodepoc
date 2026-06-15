"""
Sample IQ2020 Model — Flask API
Serves all data endpoints from /sourcedata Excel files.
"""
import math
import os
import random
from datetime import timedelta
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "iq2020-poc-dev-secret-2025")
app.permanent_session_lifetime = timedelta(hours=24)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,    # HTTPS; local dev gets no-auth fallback
    SESSION_COOKIE_SAMESITE="Lax",
)
CORS(app)

DATA = Path(__file__).parent.parent / "sourcedata"

_cache: dict = {}


def df(name: str) -> pd.DataFrame:
    if name not in _cache:
        p = DATA / f"{name}.xlsx"
        _cache[name] = pd.read_excel(p) if p.exists() else pd.DataFrame()
    return _cache[name]


def _int(v) -> int:
    try:
        f = float(v)
        return 0 if math.isnan(f) else int(f)
    except Exception:
        return 0


def _flt(v, n=2) -> float:
    try:
        f = float(v)
        return 0.0 if math.isnan(f) else round(f, n)
    except Exception:
        return 0.0


# ── Session helpers ───────────────────────────────────────────────────
def _session_user() -> dict | None:
    """Return the authenticated user dict from the session, or None."""
    return session.get("user")


def _enforce_territory(requested: str) -> str:
    """
    For Field Reps: ignore the query param and return their own territory.
    For Dist Managers and Admins: honour the requested value.
    No session (local dev / unauthenticated): pass through unchanged.
    """
    u = _session_user()
    if u is None:
        return requested
    if u["role"] in ("Admin", "Dist Manager"):
        return requested
    return u["territory"]


# ── Reference ────────────────────────────────────────────────────────
@app.get("/api/territories")
def territories():
    terr = df("Dim_Territory")
    out = [{"id": "ALL", "name": "All Territories"}]
    for _, r in terr.iterrows():
        out.append({"id": r["TerritoryID"], "name": f"{r['TerritoryID']} — {r['TerritoryName']}"})
    return jsonify(out)


# ── KPI Summary Cards ─────────────────────────────────────────────────
@app.get("/api/kpis")
def kpis():
    territory = _enforce_territory(request.args.get("territory", "ALL"))
    period = request.args.get("period", "2025-06")

    kpi = df("KPI_Territory")
    m = kpi[kpi["PeriodDate"] == period]
    if territory and territory != "ALL":
        m = m[m["TerritoryID"] == territory]

    prev_period = f"2025-{int(period[-2:])-1:02d}"
    prev = kpi[kpi["PeriodDate"] == prev_period]
    if territory and territory != "ALL":
        prev = prev[prev["TerritoryID"] == territory]

    trx_now = _int(m["CM_TRx"].sum())
    trx_prev = _int(prev["CM_TRx"].sum())
    nrx_now = _int(m["CM_NRx"].sum())
    nrx_prev = _int(prev["CM_NRx"].sum())
    calls_now = _int(m["CM_Calls"].sum())
    calls_prev = _int(prev["CM_Calls"].sum())

    return jsonify({
        "trx": trx_now,
        "trx_delta": _flt((trx_now - trx_prev) / max(1, trx_prev) * 100),
        "nrx": nrx_now,
        "nrx_delta": _flt((nrx_now - nrx_prev) / max(1, nrx_prev) * 100),
        "calls": calls_now,
        "calls_delta": _flt((calls_now - calls_prev) / max(1, calls_prev) * 100),
        "attainment": _flt(m["CM_TRx_Attainment_Pct"].mean()),
        "new_patients": _int(m["CM_NewPatients"].sum()),
        "trx_share": _flt(m["CM_TRx_Share_Pct"].mean()),
        "hcp_called": _flt(m["HCP_Called_Pct"].mean()),
        "market_trx": _int(m["CM_Market_TRx"].sum()),
    })


# ── Monthly Trend ─────────────────────────────────────────────────────
@app.get("/api/trend")
def trend():
    territory = _enforce_territory(request.args.get("territory", "ALL"))
    kpi = df("KPI_Territory")
    if territory and territory != "ALL":
        kpi = kpi[kpi["TerritoryID"] == territory]

    g = kpi.groupby("PeriodDate").agg(
        TRx=("CM_TRx", "sum"), NRx=("CM_NRx", "sum"),
        NEXOLID=("NEXOLID_TRx", "sum"), VERITONEX=("VERITONEX_TRx", "sum"),
        CLAROZEPT=("CLAROZEPT_TRx", "sum"), DEPTRAZOL=("DEPTRAZOL_TRx", "sum"),
        NewPts=("CM_NewPatients", "sum"), Calls=("CM_Calls", "sum"),
    ).reset_index().sort_values("PeriodDate")

    months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
    labels = [f"{months[int(p[-2:])-1]} 25" for p in g["PeriodDate"]]
    return jsonify({
        "labels": labels,
        "trx": [_int(v) for v in g["TRx"]],
        "nrx": [_int(v) for v in g["NRx"]],
        "nexolid": [_int(v) for v in g["NEXOLID"]],
        "veritonex": [_int(v) for v in g["VERITONEX"]],
        "clarozept": [_int(v) for v in g["CLAROZEPT"]],
        "deptrazol": [_int(v) for v in g["DEPTRAZOL"]],
        "new_patients": [_int(v) for v in g["NewPts"]],
        "calls": [_int(v) for v in g["Calls"]],
    })


# ── Territory Performance ─────────────────────────────────────────────
@app.get("/api/territory-perf")
def territory_perf():
    period = request.args.get("period", "2025-06")
    territory = _enforce_territory("ALL")
    kpi = df("KPI_Territory")
    reps = df("Dim_SalesRep")[["TerritoryID", "RepFullName"]].drop_duplicates()
    m = kpi[kpi["PeriodDate"] == period].merge(reps, on="TerritoryID", how="left")
    if territory != "ALL":
        m = m[m["TerritoryID"] == territory]

    result = []
    for _, r in m.iterrows():
        result.append({
            "tid": r["TerritoryID"],
            "name": r["TerritoryName"],
            "region": r["RegionName"],
            "area": r["AreaName"],
            "rep": r.get("RepFullName", "—"),
            "trx": _int(r["CM_TRx"]),
            "nrx": _int(r["CM_NRx"]),
            "trx_prior": _int(r["CM_TRx_Prior"]),
            "trx_chg": _flt(r["CM_TRx_Change_Pct"]),
            "share": _flt(r["CM_TRx_Share_Pct"]),
            "attain": _flt(r["CM_TRx_Attainment_Pct"]),
            "calls": _int(r["CM_Calls"]),
            "hcp_cvg": _flt(r["HCP_Called_Pct"]),
            "new_pts": _int(r["CM_NewPatients"]),
            "call_freq": _flt(r["Call_Frequency_Avg"]),
            "nexolid": _int(r["NEXOLID_TRx"]),
            "veritonex": _int(r["VERITONEX_TRx"]),
            "clarozept": _int(r["CLAROZEPT_TRx"]),
            "deptrazol": _int(r["DEPTRAZOL_TRx"]),
        })
    return jsonify(sorted(result, key=lambda x: x["attain"], reverse=True))


# ── Product / Market Share ────────────────────────────────────────────
@app.get("/api/product-share")
def product_share():
    period = request.args.get("period", "2025-06")
    territory = _enforce_territory(request.args.get("territory", "ALL"))
    rx = df("Fact_Prescriptions")
    m = rx[rx["PeriodDate"] == period]
    if territory and territory != "ALL":
        m = m[m["TerritoryID"] == territory]

    g = m.groupby("ProductFamily").agg(
        TRx=("TRx", "sum"), NRx=("NRx", "sum"), MktTRx=("Market_TRx", "sum")
    ).reset_index()
    total = g["TRx"].sum()
    return jsonify([
        {
            "product": r["ProductFamily"],
            "trx": _int(r["TRx"]),
            "nrx": _int(r["NRx"]),
            "portfolio_pct": _flt(r["TRx"] / total * 100 if total else 0),
            "market_share": _flt(r["TRx"] / r["MktTRx"] * 100 if r["MktTRx"] else 0),
        }
        for _, r in g.iterrows()
    ])


# ── Payer Mix ─────────────────────────────────────────────────────────
@app.get("/api/payer-mix")
def payer_mix():
    period = request.args.get("period", "2025-06")
    rx = df("Fact_Prescriptions")
    m = rx[rx["PeriodDate"] == period]
    g = m.groupby("PayerType")["TRx"].sum().reset_index()
    total = g["TRx"].sum()
    return jsonify([
        {"payer": r["PayerType"], "trx": _int(r["TRx"]),
         "pct": _flt(r["TRx"] / total * 100 if total else 0)}
        for _, r in g.sort_values("TRx", ascending=False).iterrows()
    ])


# ── HCP Tracker ───────────────────────────────────────────────────────
@app.get("/api/hcp-tracker")
def hcp_tracker():
    territory = _enforce_territory(request.args.get("territory", "ALL"))
    h = df("KPI_HCP360")
    if territory and territory != "ALL":
        h = h[h["TerritoryID"] == territory]

    result = []
    for _, r in h.iterrows():
        result.append({
            "cid": r["CustomerID"],
            "name": r["DisplayName"],
            "specialty": r["Specialty"],
            "city": r["City"],
            "state": r["State"],
            "territory": r["TerritoryID"],
            "decile": _int(r["DecileRank"]),
            "segment": r["Segment"],
            "trx": _int(r["CM_Total_TRx"]),
            "nrx": _int(r["CM_Total_NRx"]),
            "trx_chg": _flt(r["CM_TRx_Change_Pct"]),
            "share": _flt(r["YTD_TRx_Share_Avg"]),
            "calls_cm": _int(r["CM_Calls"]),
            "calls_ytd": _int(r["YTD_Calls"]),
            "last_call": str(r["Last_Call_Date"]),
            "new_pts": _int(r["CM_New_Patients"]),
            "speaker": r["Is_Speaker"],
            "nexolid": _int(r["NEXOLID_TRx_CM"]),
            "veritonex": _int(r["VERITONEX_TRx_CM"]),
            "patients": _int(r["CM_Total_Patients"]),
        })
    return jsonify(sorted(result, key=lambda x: x["trx"], reverse=True))


# ── HCP Profile ───────────────────────────────────────────────────────
@app.get("/api/hcp/<cid>")
def hcp_profile(cid):
    h360 = df("KPI_HCP360")
    mc = df("Dim_MasterCustomer")
    rxs = df("Fact_Prescriptions")
    cls = df("Fact_Calls")

    row = h360[h360["CustomerID"] == cid]
    if row.empty:
        return jsonify({"error": "Not found"}), 404
    r = row.iloc[0]
    mc_r = mc[mc["CustomerID"] == cid]
    addr = ""
    if not mc_r.empty:
        x = mc_r.iloc[0]
        addr = f"{x['AddressLine1']}, {x['City']}, {x['State']} {x['ZipCode']}"

    rx_hcp = rxs[rxs["CustomerID"] == cid]
    months = ["Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25"]
    periods = [f"2025-{m:02d}" for m in range(1, 7)]
    trend = {}
    for fam in ["NEXOLID", "VERITONEX", "CLAROZEPT", "DEPTRAZOL"]:
        sub = rx_hcp[rx_hcp["ProductFamily"] == fam].set_index("PeriodDate")
        trend[fam] = {
            "labels": months,
            "trx": [_int(sub.loc[p, "TRx"]) if p in sub.index else 0 for p in periods],
            "nrx": [_int(sub.loc[p, "NRx"]) if p in sub.index else 0 for p in periods],
        }

    u = _session_user()
    calls_filter = cls["CustomerID"] == cid
    if u and u["role"] == "Field Rep":
        calls_filter = calls_filter & (cls["TerritoryID"] == u["territory"])
    ch = cls[calls_filter].sort_values("CallDate", ascending=False).head(8)
    calls_out = [
        {"date": str(c["CallDate"]), "type": c["CallType"],
         "outcome": c["CallOutcome"], "product": c["ProductFamily"],
         "samples": _int(c["SamplesLeft"])}
        for _, c in ch.iterrows()
    ]

    return jsonify({
        "cid": cid, "name": str(r["DisplayName"]), "npi": str(r["NPI"]),
        "specialty": str(r["Specialty"]), "address": addr,
        "decile": _int(r["DecileRank"]), "segment": str(r["Segment"]),
        "speaker": str(r["Is_Speaker"]),
        "trx": _int(r["CM_Total_TRx"]), "nrx": _int(r["CM_Total_NRx"]),
        "trx_chg": _flt(r["CM_TRx_Change_Pct"]),
        "calls_cm": _int(r["CM_Calls"]), "calls_ytd": _int(r["YTD_Calls"]),
        "last_call": str(r["Last_Call_Date"]),
        "patients": _int(r["CM_Total_Patients"]),
        "new_patients": _int(r["CM_New_Patients"]),
        "products": {
            "NEXOLID": {"trx": _int(r["NEXOLID_TRx_CM"]), "nrx": _int(r["NEXOLID_NRx_CM"]), "share": _flt(r["NEXOLID_TRxShare_Pct"])},
            "VERITONEX": {"trx": _int(r["VERITONEX_TRx_CM"]), "nrx": _int(r["VERITONEX_NRx_CM"]), "share": _flt(r["VERITONEX_TRxShare_Pct"])},
            "CLAROZEPT": {"trx": _int(r["CLAROZEPT_TRx_CM"]), "nrx": _int(r["CLAROZEPT_NRx_CM"]), "share": _flt(r["CLAROZEPT_TRxShare_Pct"])},
            "DEPTRAZOL": {"trx": _int(r["DEPTRAZOL_TRx_CM"]), "nrx": _int(r["DEPTRAZOL_NRx_CM"]), "share": _flt(r["DEPTRAZOL_TRxShare_Pct"])},
        },
        "trend": trend,
        "calls": calls_out,
    })


# ── HCP Prescriber Concentration (Pareto / IQ2020 style) ─────────────
@app.get("/api/hcp-concentration")
def hcp_concentration():
    territory = _enforce_territory(request.args.get("territory", "ALL"))

    h = df("KPI_HCP360")
    if territory and territory != "ALL":
        h = h[h["TerritoryID"] == territory]

    sorted_h = h.sort_values("CM_Total_TRx", ascending=False).reset_index(drop=True)
    n = len(sorted_h)
    total_trx = float(sorted_h["CM_Total_TRx"].sum())

    if n == 0 or total_trx == 0:
        return jsonify({"curve": [], "total_hcps": 0, "pct_hcps_80pct": 100, "decile_stats": []})

    # Sample ~30 points for a smooth curve
    step = max(1, n // 30)
    curve = [{"x": 0.0, "pareto": 0.0, "equal": 0.0}]
    cum_trx = 0.0
    for i, row in sorted_h.iterrows():
        cum_trx += max(0, _int(row.get("CM_Total_TRx", 0)))
        if (i + 1) % step == 0 or i == n - 1:
            x = round((i + 1) / n * 100, 1)
            pareto = round(cum_trx / total_trx * 100, 1)
            curve.append({"x": x, "pareto": pareto, "equal": x})

    # % of HCPs responsible for 80% of TRx
    pct_for_80 = 100.0
    for pt in curve:
        if pt["pareto"] >= 80:
            pct_for_80 = pt["x"]
            break

    # Top decile breakdown for the table
    decile_stats = []
    for d in [10, 9, 8, 7, 6]:
        grp = sorted_h[sorted_h["DecileRank"] == d]
        d_trx = float(grp["CM_Total_TRx"].sum())
        decile_stats.append({
            "decile": d,
            "hcps": len(grp),
            "pct_hcps": round(len(grp) / n * 100, 1),
            "pct_trx": round(d_trx / total_trx * 100, 1),
            "trx": _int(d_trx),
        })

    return jsonify({
        "curve": curve,
        "total_hcps": n,
        "pct_hcps_80pct": round(pct_for_80, 1),
        "decile_stats": decile_stats,
    })


# ── Decile Distribution ───────────────────────────────────────────────
@app.get("/api/decile")
def decile():
    hcp = df("Dim_MasterCustomer")
    calls = df("Fact_Calls")
    hcp_only = hcp[hcp["CustomerType"] == "HCP"]
    called = set(calls["CustomerID"].unique())
    dist = hcp_only.groupby("DecileRank").size().reset_index(name="total")
    dist["called"] = (
        hcp_only[hcp_only["CustomerID"].isin(called)]
        .groupby("DecileRank").size()
        .reindex(dist["DecileRank"]).fillna(0).values
    )
    return jsonify({
        "deciles": [_int(d) for d in dist["DecileRank"]],
        "total": [_int(v) for v in dist["total"]],
        "called": [_int(v) for v in dist["called"]],
    })


# ── Active Alerts ─────────────────────────────────────────────────────
@app.get("/api/alerts")
def alerts():
    period = request.args.get("period", "2025-06")
    territory = _enforce_territory(request.args.get("territory", "ALL"))
    h = df("KPI_HCP360")
    kpi = df("KPI_Territory")
    if territory != "ALL":
        h = h[h["TerritoryID"] == territory]
        kpi = kpi[kpi["TerritoryID"] == territory]
    out = []

    for _, r in h.nlargest(4, "CM_New_Patients").iterrows():
        if _int(r["CM_New_Patients"]) < 3:
            continue
        out.append({"type": "NEW_PATIENT", "priority": "HIGH", "color": "#22c55e",
                    "icon": "person-plus",
                    "title": f"New Starts — {r['DisplayName']}",
                    "msg": f"{_int(r['CM_New_Patients'])} new patients this month · Seg {r['Segment']} · Decile {_int(r['DecileRank'])}",
                    "action": "View Profile", "cid": r["CustomerID"]})

    declining = h[h["CM_TRx_Change_Pct"] < -10].nsmallest(4, "CM_TRx_Change_Pct")
    for _, r in declining.iterrows():
        out.append({"type": "DECLINE", "priority": "HIGH", "color": "#ef4444",
                    "icon": "trending-down",
                    "title": f"TRx Decline — {r['DisplayName']}",
                    "msg": f"Down {abs(_flt(r['CM_TRx_Change_Pct']))}% vs prior · {r['Specialty']} · Seg {r['Segment']}",
                    "action": "Schedule Call", "cid": r["CustomerID"]})

    no_call = h[h["CM_Calls"] == 0].nlargest(4, "DecileRank")
    for _, r in no_call.iterrows():
        out.append({"type": "NO_CALL", "priority": "MEDIUM", "color": "#f97316",
                    "icon": "phone-off",
                    "title": f"Missed Call — {r['DisplayName']}",
                    "msg": f"Decile {_int(r['DecileRank'])} {r['Specialty']} — no call this month",
                    "action": "Add to Call Plan", "cid": r["CustomerID"]})

    kpi_m = kpi[kpi["PeriodDate"] == period]
    for _, r in kpi_m[kpi_m["CM_TRx_Attainment_Pct"] < 85].nsmallest(3, "CM_TRx_Attainment_Pct").iterrows():
        out.append({"type": "LOW_TARGET", "priority": "MEDIUM", "color": "#a855f7",
                    "icon": "target",
                    "title": f"Below Target — {r['TerritoryName']}",
                    "msg": f"{_flt(r['CM_TRx_Attainment_Pct'])}% of TRx quota · {_int(r['CM_Calls'])} calls this month",
                    "action": "View Territory", "cid": None})

    return jsonify(out)


# ── Speaker Programs ──────────────────────────────────────────────────
@app.get("/api/speakers")
def speakers():
    s = df("Dim_Speaker")
    return jsonify([
        {"sid": r["SpeakerID"], "name": r["SpeakerName"], "specialty": r["Specialty"],
         "tier": r["SpeakerTier"], "programs": _int(r["Programs_YTD"]),
         "attendees": _int(r["Attendees_Avg"]), "honorarium": _int(r["Honorarium_YTD_USD"]),
         "last_prog": str(r["LastProgramDate"]), "products": r["CertifiedProducts"]}
        for _, r in s.iterrows()
    ])


# ── Vaccines BU ───────────────────────────────────────────────────────
@app.get("/api/vaccines")
def vaccines():
    kpi = df("KPI_Territory")
    VAX = {
        "Shingrix (RZV)": {"base": 0.35, "color": "#e15759"},
        "Fluarix Tetra": {"base": 0.28, "color": "#4e79a7"},
        "Bexsero (MenB)": {"base": 0.18, "color": "#f28e2b"},
        "Boostrix (Tdap)": {"base": 0.12, "color": "#59a14f"},
        "Havrix (HepA)": {"base": 0.07, "color": "#76b7b2"},
    }
    random.seed(77)
    trend_labels = ["Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25"]
    vax_trend = {}
    total_trx = int(kpi["CM_TRx"].sum())
    for vname, meta in VAX.items():
        doses = [int(total_trx * meta["base"] * (1 + random.uniform(-0.08, 0.15))) for _ in range(6)]
        vax_trend[vname] = {"doses": doses, "color": meta["color"]}

    terr_cov = []
    for _, r in kpi[kpi["PeriodDate"] == "2025-06"].iterrows():
        terr_cov.append({
            "territory": r["TerritoryName"],
            "shingrix_doses": int(r["CM_TRx"] * 0.35),
            "coverage_pct": _flt(r["HCP_Called_Pct"] * random.uniform(0.65, 0.95)),
        })

    return jsonify({"trend_labels": trend_labels, "vaccines": vax_trend, "territory_coverage": terr_cov})


# ── Auth — test users (POC only, no production secrets) ──────────────
USERS = {
    "jsmith": {"password": "Pass1234", "name": "John Smith",   "role": "Field Rep",    "territory": "T001"},
    "mjones": {"password": "Pass1234", "name": "Mary Jones",   "role": "Dist Manager", "territory": "ALL"},
    "rlee":   {"password": "Pass1234", "name": "Robert Lee",   "role": "Field Rep",    "territory": "T002"},
    "schen":  {"password": "Pass1234", "name": "Sandra Chen",  "role": "Field Rep",    "territory": "T003"},
    "admin":  {"password": "Admin123", "name": "Admin User",   "role": "Admin",        "territory": "ALL"},
}


@app.post("/api/auth/login")
def auth_login():
    body = request.get_json(force=True, silent=True) or {}
    username = body.get("username", "").strip().lower()
    password = body.get("password", "")
    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Invalid username or password"}), 401
    session.clear()
    session.permanent = True
    session["user"] = {
        "username":  username,
        "territory": user["territory"],
        "role":      user["role"],
    }
    return jsonify({
        "username": username,
        "name":     user["name"],
        "role":     user["role"],
        "territory":user["territory"],
        "initials": "".join(p[0].upper() for p in user["name"].split()[:2]),
    })


@app.post("/api/auth/logout")
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/auth/users")
def auth_users():
    """Returns demo credential list for the login helper panel."""
    return jsonify([
        {"username": u, "role": d["role"], "name": d["name"], "password": d["password"]}
        for u, d in USERS.items()
    ])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
