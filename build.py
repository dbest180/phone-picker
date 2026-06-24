#!/usr/bin/env python3
"""
build.py — SignalEQ data pipeline (v2: dual-tier output)

Reads per-tier CSVs, scores each phone with that tier's engine, and injects
the resulting PHONES array into the matching HTML file.

Tiers:
  flagship -> phones_flagship.csv -> flagships.html      (v4 scoring)
  budget   -> phones_budget.csv   -> index_budget_phones.html (budget v1 scoring)

Each tier also gets its own rankings file:
  rankings_flagship.json
  rankings_budget.json

Usage:
  python build.py                # build whichever tiers have a CSV present
  python build.py flagship       # build just one tier
  python build.py budget
"""

import csv
import json
import math
import re
import sys
from pathlib import Path

# ── Tier configuration ──────────────────────────────────────────
# Add/edit tiers here. Each tier owns its CSV, its HTML target, and its
# own scoring engine — flagship and budget are NOT the same curve, so
# don't try to share base_scores() between them.

TIERS = {
    "flagship": {
        "csv": "phones_flagship.csv",
        "html": "flagships.html",
        "rankings": "rankings_flagship.json",
    },
    "budget": {
        "csv": "phones_budget.csv",
        "html": "index_budget_phones.html",
        "rankings": "rankings_budget.json",
    },
}

# ── Flagship scoring (v4 — matches flagships.html exactly) ─────

def fs_score_battery(mah):
    if mah < 6500: return 0
    if mah <= 7500: return ((mah - 6500) / 1000) * 20
    if mah >= 10000: return 23
    return 20 + ((mah - 7500) / 2500) * 3

def fs_score_price(usd):
    if usd <= 500: return 10
    if usd <= 800: return 10 - ((usd - 500) / 300) * 4
    if usd <= 1000: return 6 - ((usd - 800) / 200) * 3
    return max(0, 3 * math.exp(-0.002 * (usd - 1000)))

def fs_score_storage(gb):
    if gb >= 1024: return 20
    if gb >= 512: return 15
    if gb >= 256: return 10
    return 5

def fs_score_charging(w):
    if w >= 120: return 20
    if w >= 100: return 10
    if w >= 90: return 5
    return 0

def fs_score_display(inches):
    if inches >= 6.9: return 12
    if inches >= 6.78: return 10
    return 0

def fs_score_camera(nr):
    if nr >= 95: return 13 + ((nr - 95) / 5) * 2
    if nr >= 85: return 10 + ((nr - 85) / 10) * 3
    if nr >= 70: return 5 + ((nr - 70) / 15) * 5
    return max(0, (nr / 70) * 5)

def flagship_base_scores(p):
    return {
        "os": 25 if p["os"] == "global" else 15,
        "bat": fs_score_battery(p["bat"]),
        "price": fs_score_price(p["price"]),
        "stor": fs_score_storage(p["stor"]),
        "chg": fs_score_charging(p["chg"]),
        "disp": fs_score_display(p["disp"]),
        "cam": fs_score_camera(p["cam"]),
    }

# ── Budget scoring (v1 — matches index_budget_phones.html exactly) ─

def bg_score_battery(mah):
    if mah < 6000: return 0
    if mah <= 7500: return ((mah - 6000) / 1500) * 20
    if mah >= 10000: return 23
    return 20 + ((mah - 7500) / 2500) * 3

def bg_score_price(usd):
    if usd <= 380: return 28
    if usd <= 550: return 28 - ((usd - 380) / 170) * 14
    if usd <= 700: return 14 - ((usd - 550) / 150) * 9
    if usd <= 1000: return 5 - ((usd - 700) / 300) * 4
    return max(0, 1 * math.exp(-0.002 * (usd - 1000)))

def bg_score_storage(gb):
    if gb >= 1024: return 20
    if gb >= 512: return 15
    if gb >= 256: return 10
    return 5

def bg_score_charging(w):
    if w >= 120: return 22
    if w >= 100: return 16
    if w >= 80: return 12
    if w >= 67: return 8
    if w >= 33: return 4
    return 1

def bg_score_display(inches):
    if inches >= 6.9: return 12
    if inches >= 6.78: return 10
    if inches >= 6.6: return 8
    if inches >= 6.4: return 6
    return max(3, (inches / 6.4) * 6)

def bg_score_camera(nr):
    if nr >= 95: return 13 + ((nr - 95) / 5) * 2
    if nr >= 85: return 10 + ((nr - 85) / 10) * 3
    if nr >= 70: return 5 + ((nr - 70) / 15) * 5
    return max(0, (nr / 70) * 5)

def bg_score_perf(perf):
    return max(0, min(20, (perf or 0) * 2))

def budget_base_scores(p):
    return {
        "os": 18 if p["os"] == "global" else 14,
        "bat": bg_score_battery(p["bat"]),
        "price": bg_score_price(p["price"]),
        "stor": bg_score_storage(p["stor"]),
        "chg": bg_score_charging(p["chg"]),
        "disp": bg_score_display(p["disp"]),
        "cam": bg_score_camera(p["cam"]),
        "perf": bg_score_perf(p.get("perf")),
    }

SCORERS = {
    "flagship": flagship_base_scores,
    "budget": budget_base_scores,
}

# ── CSV loading ──────────────────────────────────────────────────
# Budget CSVs may have an extra `perf` column (1-10 manual rating).
# Flagship CSVs won't have it — that's fine, .get() handles it.

def load_phones(csv_path):
    phones = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            phone = {
                "model": row["model"],
                "bat": int(row["battery_mAh"]),
                "chg": int(row["charging_W"]),
                "cam": int(row["camera_quality"]),
                "disp": float(row["display_size_inches"]),
                "stor": int(row["storage_gb"]),
                "ram": int(row["ram_gb"]),
                "price": int(row["price_usd"]),
                "os": "global" if "global" in row["os_type"].lower() else "china",
            }
            if "perf" in row and row["perf"] not in (None, ""):
                phone["perf"] = int(row["perf"])
            phones.append(phone)
    return phones

# ── HTML injection ───────────────────────────────────────────────

def inject_phones(html_path, phones):
    js_data = "const PHONES = " + json.dumps(phones, indent=2) + ";"

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    pattern = r"const PHONES = \[.*?\];"
    if not re.search(pattern, html, flags=re.DOTALL):
        print(f"⚠️  Could not find 'const PHONES = [...]' in {html_path}.")
        print("   Skipping — check that this is the right tool file, not the landing page.")
        return False

    new_html = re.sub(pattern, js_data, html, flags=re.DOTALL)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    return True

# ── Per-tier build ────────────────────────────────────────────────

def build_tier(tier_name, cfg):
    csv_path = Path(cfg["csv"])
    html_path = Path(cfg["html"])

    if not csv_path.exists():
        print(f"⏭️  [{tier_name}] {csv_path} not found — skipping this tier.")
        return
    if not html_path.exists():
        print(f"❌ [{tier_name}] {html_path} not found — skipping this tier.")
        return

    phones = load_phones(csv_path)
    ok = inject_phones(html_path, phones)
    if not ok:
        return

    scorer = SCORERS[tier_name]
    ranked = []
    for p in phones:
        b = scorer(p)
        total = sum(b.values())
        ranked.append({
            "model": p["model"],
            "os": p["os"],
            "score": round(total, 1),
            "specs": p,
        })
    ranked.sort(key=lambda x: x["score"], reverse=True)

    with open(cfg["rankings"], "w", encoding="utf-8") as f:
        json.dump(ranked, f, indent=2)

    print(f"✅ [{tier_name}] Updated {html_path} with {len(phones)} phones")
    print(f"   Top: {ranked[0]['model']} ({ranked[0]['score']} pts)  →  {cfg['rankings']}")

# ── Run ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    requested = sys.argv[1:] or list(TIERS.keys())
    unknown = [t for t in requested if t not in TIERS]
    if unknown:
        print(f"❌ Unknown tier(s): {', '.join(unknown)}. Valid tiers: {', '.join(TIERS)}")
        sys.exit(1)

    ran_any = False
    for tier_name in requested:
        build_tier(tier_name, TIERS[tier_name])
        ran_any = True

    if not ran_any:
        print("Nothing to build — no valid tiers specified.")
