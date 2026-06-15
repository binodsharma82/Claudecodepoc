"""
Sample IQ2020 Model — FastAPI Application Layer
Serves dashboard UI and REST data endpoints from /sourcedata Excel files.
"""
import math
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Sample IQ2020 Model")
app.mount("/static", StaticFiles(directory="static"), name="static")

DATA = Path("sourcedata")

# ── In-memory data cache ────────────────────────────────────────────
_cache: dict[str, pd.DataFrame] = {}

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

# ── Pages ───────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def dashboard():
    return FileResponse("templates/index.html")

# ── API: Reference ──────────────────────────────────────────────────
@app.get("/api/territories")
async def territories():
    terr = df("Dim_Territory")
    out = [{"id": "ALL", "name": "All Territories"}]
    for _, r in terr.iterrows():
        out.append({"id": r["TerritoryID"], "name": f"{r['TerritoryID']} — {r['TerritoryName']}"})
    return out

# ── API: KPI Summary Cards ──────────────────────────────────────────
@app.get("/api/kpis")
async def kpis(territory: Optional[str] = "ALL", period: str = "2025-06"):
    kpi = df("KPI_Territory")
    m = kpi[kpi["PeriodDate"] == period]
    if territory and territory != "ALL":
        m = m[m["TerritoryID"] == territory]

    prev_period = f"2025-{int(period[-2:])-1:02d}"
    prev = kpi[kpi["PeriodDate"] == prev_period]
    if territory and territory != "ALL":
        prev = prev[prev["TerritoryID"] == territory]

    trx_now   = _int(m["CM_TRx"].sum())
    trx_prev  = _int(prev["CM_TRx"].sum())
    nrx_now   = _int(m["CM_NRx"].sum())
    nrx_prev  = _int(prev["CM_NRx"].sum())
    calls_now = _int(m["CM_Calls"].sum())
    calls_prev= _int(prev["CM_Calls"].sum())

    return {
        "trx":          trx_now,
        "trx_delta":    _flt((trx_now - trx_prev) / max(1, trx_prev) * 100),
        "nrx":          nrx_now,
        "nrx_delta":    _flt((nrx_now - nrx_prev) / max(1, nrx_prev) * 100),
        "calls":        calls_now,
        "calls_delta":  _flt((calls_now - calls_prev) / max(1, calls_prev) * 100),
        "attainment":   _flt(m["CM_TRx_Attainment_Pct"].mean()),
        "new_patients": _int(m["CM_NewPatients"].sum()),
        "trx_share":    _flt(m["CM_TRx_Share_Pct"].mean()),
        "hcp_called":   _flt(m["HCP_Called_Pct"].mean()),
        "market_trx":   _int(m["CM_Market_TRx"].sum()),
    }

# ── API: Monthly Trend ──────────────────────────────────────────────
@app.get("/api/trend")
async def trend(territory: Optional[str] = "ALL"):
    kpi = df("KPI_Territory")
    if territory and territory != "ALL":
        kpi = kpi[kpi["TerritoryID"] == territory]

    g = kpi.groupby("PeriodDate").agg(
        TRx=("CM_TRx","sum"), NRx=("CM_NRx","sum"),
        NEXOLID=("NEXOLID_TRx","sum"), VERITONEX=("VERITONEX_TRx","sum"),
        CLAROZEPT=("CLAROZEPT_TRx","sum"), DEPTRAZOL=("DEPTRAZOL_TRx","sum"),
        NewPts=("CM_NewPatients","sum"), Calls=("CM_Calls","sum"),
        NEXOLID_NRx=("NEXOLID_NRx","sum"), VERITONEX_NRx=("VERITONEX_NRx","sum"),
    ).reset_index().sort_values("PeriodDate")

    labels = [f"{'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()[int(p[-2:])-1]} 25"
              for p in g["PeriodDate"]]
    return {
        "labels":       labels,
        "trx":          [_int(v) for v in g["TRx"]],
        "nrx":          [_int(v) for v in g["NRx"]],
        "nexolid":      [_int(v) for v in g["NEXOLID"]],
        "veritonex":    [_int(v) for v in g["VERITONEX"]],
        "clarozept":    [_int(v) for v in g["CLAROZEPT"]],
        "deptrazol":    [_int(v) for v in g["DEPTRAZOL"]],
        "nexolid_nrx":  [_int(v) for v in g["NEXOLID_NRx"]],
        "veritonex_nrx":[_int(v) for v in g["VERITONEX_NRx"]],
        "new_patients": [_int(v) for v in g["NewPts"]],
        "calls":        [_int(v) for v in g["Calls"]],
    }

# ── API: Territory Performance ──────────────────────────────────────
@app.get("/api/territory-perf")
async def territory_perf(period: str = "2025-06"):
    kpi  = df("KPI_Territory")
    reps = df("Dim_SalesRep")[["TerritoryID","RepFullName"]].drop_duplicates()
    m = kpi[kpi["PeriodDate"] == period].merge(reps, on="TerritoryID", how="left")

    result = []
    for _, r in m.iterrows():
        result.append({
            "tid":         r["TerritoryID"],
            "name":        r["TerritoryName"],
            "region":      r["RegionName"],
            "area":        r["AreaName"],
            "rep":         r.get("RepFullName","—"),
            "trx":         _int(r["CM_TRx"]),
            "nrx":         _int(r["CM_NRx"]),
            "trx_prior":   _int(r["CM_TRx_Prior"]),
            "trx_chg":     _flt(r["CM_TRx_Change_Pct"]),
            "share":       _flt(r["CM_TRx_Share_Pct"]),
            "attain":      _flt(r["CM_TRx_Attainment_Pct"]),
            "calls":       _int(r["CM_Calls"]),
            "hcp_cvg":     _flt(r["HCP_Called_Pct"]),
            "new_pts":     _int(r["CM_NewPatients"]),
            "call_freq":   _flt(r["Call_Frequency_Avg"]),
            "nexolid":     _int(r["NEXOLID_TRx"]),
            "veritonex":   _int(r["VERITONEX_TRx"]),
            "clarozept":   _int(r["CLAROZEPT_TRx"]),
            "deptrazol":   _int(r["DEPTRAZOL_TRx"]),
        })
    return sorted(result, key=lambda x: x["attain"], reverse=True)

# ── API: Product / Market Share ─────────────────────────────────────
@app.get("/api/product-share")
async def product_share(period: str = "2025-06", territory: Optional[str] = "ALL"):
    rx = df("Fact_Prescriptions")
    m  = rx[rx["PeriodDate"] == period]
    if territory and territory != "ALL":
        m = m[m["TerritoryID"] == territory]

    g = m.groupby("ProductFamily").agg(TRx=("TRx","sum"), NRx=("NRx","sum"),
                                        MktTRx=("Market_TRx","sum")).reset_index()
    total = g["TRx"].sum()
    return [
        {"product": r["ProductFamily"], "trx": _int(r["TRx"]), "nrx": _int(r["NRx"]),
         "portfolio_pct": _flt(r["TRx"]/total*100 if total else 0),
         "market_share":  _flt(r["TRx"]/r["MktTRx"]*100 if r["MktTRx"] else 0)}
        for _, r in g.iterrows()
    ]

# ── API: Payer Mix ───────────────────────────────────────────────────
@app.get("/api/payer-mix")
async def payer_mix(period: str = "2025-06"):
    rx = df("Fact_Prescriptions")
    m  = rx[rx["PeriodDate"] == period]
    g  = m.groupby("PayerType")["TRx"].sum().reset_index()
    total = g["TRx"].sum()
    return [{"payer": r["PayerType"], "trx": _int(r["TRx"]),
             "pct": _flt(r["TRx"]/total*100 if total else 0)}
            for _, r in g.sort_values("TRx", ascending=False).iterrows()]

# ── API: HCP Tracker ────────────────────────────────────────────────
@app.get("/api/hcp-tracker")
async def hcp_tracker(territory: Optional[str] = "ALL"):
    h = df("KPI_HCP360")
    if territory and territory != "ALL":
        h = h[h["TerritoryID"] == territory]

    result = []
    for _, r in h.iterrows():
        result.append({
            "cid":        r["CustomerID"],
            "name":       r["DisplayName"],
            "specialty":  r["Specialty"],
            "city":       r["City"],
            "state":      r["State"],
            "territory":  r["TerritoryID"],
            "decile":     _int(r["DecileRank"]),
            "segment":    r["Segment"],
            "trx":        _int(r["CM_Total_TRx"]),
            "nrx":        _int(r["CM_Total_NRx"]),
            "trx_chg":    _flt(r["CM_TRx_Change_Pct"]),
            "share":      _flt(r["YTD_TRx_Share_Avg"]),
            "calls_cm":   _int(r["CM_Calls"]),
            "calls_ytd":  _int(r["YTD_Calls"]),
            "last_call":  str(r["Last_Call_Date"]),
            "new_pts":    _int(r["CM_New_Patients"]),
            "speaker":    r["Is_Speaker"],
            "nexolid":    _int(r["NEXOLID_TRx_CM"]),
            "veritonex":  _int(r["VERITONEX_TRx_CM"]),
            "patients":   _int(r["CM_Total_Patients"]),
        })
    return sorted(result, key=lambda x: x["trx"], reverse=True)

# ── API: HCP Profile ────────────────────────────────────────────────
@app.get("/api/hcp/{cid}")
async def hcp_profile(cid: str):
    h360 = df("KPI_HCP360")
    mc   = df("Dim_MasterCustomer")
    rxs  = df("Fact_Prescriptions")
    cls  = df("Fact_Calls")

    row  = h360[h360["CustomerID"] == cid]
    if row.empty:
        return {"error": "Not found"}
    r    = row.iloc[0]
    mc_r = mc[mc["CustomerID"] == cid]
    addr = ""
    if not mc_r.empty:
        x = mc_r.iloc[0]
        addr = f"{x['AddressLine1']}, {x['City']}, {x['State']} {x['ZipCode']}"

    # Monthly trend per product
    rx_hcp = rxs[rxs["CustomerID"] == cid]
    trend  = {}
    months = ["Jan 25","Feb 25","Mar 25","Apr 25","May 25","Jun 25"]
    periods= [f"2025-{m:02d}" for m in range(1,7)]
    for fam in ["NEXOLID","VERITONEX","CLAROZEPT","DEPTRAZOL"]:
        sub = rx_hcp[rx_hcp["ProductFamily"] == fam].set_index("PeriodDate")
        trend[fam] = {
            "labels": months,
            "trx":    [_int(sub.loc[p,"TRx"]) if p in sub.index else 0 for p in periods],
            "nrx":    [_int(sub.loc[p,"NRx"]) if p in sub.index else 0 for p in periods],
        }

    # Call history
    ch = cls[cls["CustomerID"] == cid].sort_values("CallDate", ascending=False).head(8)
    calls_out = [
        {"date": str(c["CallDate"]), "type": c["CallType"],
         "outcome": c["CallOutcome"], "product": c["ProductFamily"],
         "samples": _int(c["SamplesLeft"])}
        for _, c in ch.iterrows()
    ]

    return {
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
            "NEXOLID":   {"trx": _int(r["NEXOLID_TRx_CM"]),  "nrx": _int(r["NEXOLID_NRx_CM"]),  "share": _flt(r["NEXOLID_TRxShare_Pct"])},
            "VERITONEX": {"trx": _int(r["VERITONEX_TRx_CM"]),"nrx": _int(r["VERITONEX_NRx_CM"]),"share": _flt(r["VERITONEX_TRxShare_Pct"])},
            "CLAROZEPT": {"trx": _int(r["CLAROZEPT_TRx_CM"]),"nrx": _int(r["CLAROZEPT_NRx_CM"]),"share": _flt(r["CLAROZEPT_TRxShare_Pct"])},
            "DEPTRAZOL": {"trx": _int(r["DEPTRAZOL_TRx_CM"]),"nrx": _int(r["DEPTRAZOL_NRx_CM"]),"share": _flt(r["DEPTRAZOL_TRxShare_Pct"])},
        },
        "trend": trend,
        "calls": calls_out,
    }

# ── API: Decile Distribution ────────────────────────────────────────
@app.get("/api/decile")
async def decile():
    hcp   = df("Dim_MasterCustomer")
    calls = df("Fact_Calls")
    hcp_only = hcp[hcp["CustomerType"] == "HCP"]
    called   = set(calls["CustomerID"].unique())
    dist = hcp_only.groupby("DecileRank").size().reset_index(name="total")
    dist["called"] = hcp_only[hcp_only["CustomerID"].isin(called)].groupby("DecileRank").size().reindex(dist["DecileRank"]).fillna(0).values
    return {
        "deciles": [_int(d) for d in dist["DecileRank"]],
        "total":   [_int(v) for v in dist["total"]],
        "called":  [_int(v) for v in dist["called"]],
    }

# ── API: Active Alerts ──────────────────────────────────────────────
@app.get("/api/alerts")
async def alerts(period: str = "2025-06"):
    h   = df("KPI_HCP360")
    kpi = df("KPI_Territory")
    out = []

    # New patient starts
    for _, r in h.nlargest(4, "CM_New_Patients").iterrows():
        if _int(r["CM_New_Patients"]) < 3:
            continue
        out.append({"type":"NEW_PATIENT","priority":"HIGH","color":"#198754","icon":"bi-person-plus-fill",
            "title":f"New Starts — {r['DisplayName']}",
            "msg":f"{_int(r['CM_New_Patients'])} new patients this month · Seg {r['Segment']} · Decile {_int(r['DecileRank'])}",
            "action":"View Profile","cid": r["CustomerID"]})

    # TRx decline
    declining = h[h["CM_TRx_Change_Pct"] < -10].nsmallest(4, "CM_TRx_Change_Pct")
    for _, r in declining.iterrows():
        out.append({"type":"DECLINE","priority":"HIGH","color":"#dc3545","icon":"bi-graph-down-arrow",
            "title":f"TRx Decline — {r['DisplayName']}",
            "msg":f"Down {abs(_flt(r['CM_TRx_Change_Pct']))}% vs prior · {r['Specialty']} · Seg {r['Segment']}",
            "action":"Schedule Call","cid": r["CustomerID"]})

    # HCPs not called
    no_call = h[h["CM_Calls"] == 0].nlargest(4, "DecileRank")
    for _, r in no_call.iterrows():
        out.append({"type":"NO_CALL","priority":"MEDIUM","color":"#fd7e14","icon":"bi-telephone-x",
            "title":f"Missed Call — {r['DisplayName']}",
            "msg":f"Decile {_int(r['DecileRank'])} {r['Specialty']} — no call this month · Last: {r['Last_Call_Date']}",
            "action":"Add to Call Plan","cid": r["CustomerID"]})

    # Low attainment territories
    kpi_m = kpi[kpi["PeriodDate"] == period]
    for _, r in kpi_m[kpi_m["CM_TRx_Attainment_Pct"] < 85].nsmallest(3,"CM_TRx_Attainment_Pct").iterrows():
        out.append({"type":"LOW_TARGET","priority":"MEDIUM","color":"#6f42c1","icon":"bi-bullseye",
            "title":f"Below Target — {r['TerritoryName']}",
            "msg":f"{_flt(r['CM_TRx_Attainment_Pct'])}% of TRx quota · {_int(r['CM_Calls'])} calls this month",
            "action":"View Territory","cid": None})

    return out

# ── API: Speaker Programs ───────────────────────────────────────────
@app.get("/api/speakers")
async def speakers():
    s = df("Dim_Speaker")
    return [
        {"sid": r["SpeakerID"], "name": r["SpeakerName"], "specialty": r["Specialty"],
         "tier": r["SpeakerTier"], "programs": _int(r["Programs_YTD"]),
         "attendees": _int(r["Attendees_Avg"]), "honorarium": _int(r["Honorarium_YTD_USD"]),
         "last_prog": str(r["LastProgramDate"]), "products": r["CertifiedProducts"]}
        for _, r in s.iterrows()
    ]

# ── API: Vaccines BU (synthetic from Rx data) ───────────────────────
@app.get("/api/vaccines")
async def vaccines():
    kpi = df("KPI_Territory")
    VAX = {
        "Shingrix (RZV)":   {"base": 0.35, "color": "#e15759"},
        "Fluarix Tetra":    {"base": 0.28, "color": "#4e79a7"},
        "Bexsero (MenB)":   {"base": 0.18, "color": "#f28e2b"},
        "Boostrix (Tdap)":  {"base": 0.12, "color": "#59a14f"},
        "Havrix (HepA)":    {"base": 0.07, "color": "#76b7b2"},
    }
    import random as _r
    _r.seed(77)
    trend_labels = ["Jan 25","Feb 25","Mar 25","Apr 25","May 25","Jun 25"]
    vax_trend = {}
    for vname, meta in VAX.items():
        doses = [int(kpi["CM_TRx"].sum() * meta["base"] * (1 + _r.uniform(-0.08, 0.15))) for _ in range(6)]
        vax_trend[vname] = {"doses": doses, "color": meta["color"]}

    # Coverage by territory
    terr_cov = []
    for _, r in kpi[kpi["PeriodDate"]=="2025-06"].iterrows():
        terr_cov.append({
            "territory": r["TerritoryName"],
            "shingrix_doses": int(r["CM_TRx"] * 0.35),
            "coverage_pct": _flt(r["HCP_Called_Pct"] * _r.uniform(0.65, 0.95)),
        })

    return {"trend_labels": trend_labels, "vaccines": vax_trend, "territory_coverage": terr_cov}
