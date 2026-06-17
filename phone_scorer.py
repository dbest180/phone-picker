"""
phone_scorer.py  —  v4
Phone recommendation engine for Derrick's wife. Soft budget ~$1 000.

Scoring system
--------------
Category       Max   Notes
OS ROM         25/15  Global preferred (+10 advantage), not a deal-breaker
Battery        23     Two-segment: 6500-7500 mAh sweet spot (0→20 steep)
                      7500-10000+ mAh massive bonus but compressed (20→23)
Price          10     Three-segment, no hard cutoff above $1000:
                      ≤$800 gentle slide 10→6 | $800-$1000 moderate 6→3
                      >$1000 exponential decay toward 0, never excluded
Storage        20     256 GB = 10 | 512 GB = 15 | 1 TB = 20
Charging       20     Skewed hard: 90W = 5 | 100W = 10 | 120W = 20
Display        12     6.78"-6.89" = 10 (perfect) | 6.9"+ = 12 (icing)
Camera         15     Nanoreview composite score (0-100) mapped to 0-15 pts
                      Score 70 = 5 pts | Score 85 = 10 pts | Score 95+ = 15 pts

Global ceiling: 105 pts  |  China ceiling: 95 pts

Deal-breakers (hard exclusions)
  Battery  < 6500 mAh
  Charging < 90 W
  Display  < 6.78 inches
"""

import csv
import json
import math


# ── Scoring functions ─────────────────────────────────────────────────────────

def score_battery(mah):
    """Sweet spot 6500-7500 (steep 0→20). Bonus above 7500 compressed (20→23)."""
    if mah < 6500:
        return 0
    if mah <= 7500:
        return round(((mah - 6500) / 1000) * 20, 1)
    if mah >= 10000:
        return 23
    return round(20 + ((mah - 7500) / 2500) * 3, 1)


def score_price(usd):
    """
    Three-segment, no hard cutoff:
    ≤$500        → 10 pts (flat max)
    $500-$800    → 10→6 pts (gentle slide, low impact)
    $800-$1000   → 6→3 pts (moderate drop)
    >$1000       → exponential decay toward 0
    """
    if usd <= 500:
        return 10.0
    if usd <= 800:
        return round(10 - ((usd - 500) / 300) * 4, 1)
    if usd <= 1000:
        return round(6 - ((usd - 800) / 200) * 3, 1)
    return round(max(0, 3 * math.exp(-0.002 * (usd - 1000))), 1)


def score_storage(gb):
    if gb >= 1024: return 20
    if gb >= 512:  return 15
    if gb >= 256:  return 10
    return 5


def score_charging(w):
    """Skewed: 100→120 W jump is double the 90→100 W jump."""
    if w >= 120: return 20
    if w >= 100: return 10
    if w >= 90:  return 5
    return 0


def score_display(inches):
    if inches >= 6.9:  return 12
    if inches >= 6.78: return 10
    return 0


def score_camera(nanoreview):
    """
    Nanoreview composite (0-100) mapped to 0-15 pts.
    Below 70: minimal (these phones shouldn't be in the list anyway).
    70-85:     rising from 5→10 pts
    85-95:     rising from 10→13 pts
    95+:       13→15 pts
    """
    if nanoreview >= 95:
        return round(13 + ((nanoreview - 95) / 5) * 2, 1)
    if nanoreview >= 85:
        return round(10 + ((nanoreview - 85) / 10) * 3, 1)
    if nanoreview >= 70:
        return round(5 + ((nanoreview - 70) / 15) * 5, 1)
    return round(max(0, (nanoreview / 70) * 5), 1)


# ── Main loop ────────────────────────────────────────────────────────────────

CSV_FILE = "phones_clean.csv"
OUT_JSON = "rankings.json"
OUT_CSV  = "ranked_phones.csv"

ranked   = []
excluded = []

with open(CSV_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        row = {k.strip(): v.strip() for k, v in row.items() if k}

        model    = row["model"]
        battery  = int(row["battery_mAh"])
        charging = int(row["charging_W"])
        display  = float(row["display_size_inches"])
        price    = int(row["price_usd"])

        # ── Deal-breakers ────────────────────────────────────────────────────
        reasons = []
        if battery  < 6500: reasons.append(f"battery {battery} mAh < 6500 mAh")
        if charging < 90:   reasons.append(f"charging {charging} W < 90 W")
        if display  < 6.78: reasons.append(f"display {display}\" < 6.78\"")

        if reasons:
            print(f"  excluded  {model}: {'; '.join(reasons)}")
            excluded.append({"model": model, "reasons": reasons})
            continue

        # ── ROM (preference, not deal-breaker) ──────────────────────────────
        os_raw    = row["os_type"].strip().lower()
        is_global = "global" in os_raw
        os_label  = "global ROM" if is_global else "china ROM"
        os_score  = 25 if is_global else 15
        max_score = 105 if is_global else 95

        # ── Category scores ──────────────────────────────────────────────────
        nanoreview  = int(row["camera_quality"])
        bat_score   = score_battery(battery)
        price_score = score_price(price)
        stor_score  = score_storage(int(row["storage_gb"]))
        chg_score   = score_charging(charging)
        disp_score  = score_display(display)
        cam_score   = score_camera(nanoreview)

        total = os_score + bat_score + price_score + stor_score + chg_score + disp_score + cam_score

        ranked.append({
            "model":   model,
            "os_type": os_label,

            "specs": {
                "battery_mAh":         battery,
                "charging_W":          charging,
                "price_usd":           price,
                "storage_gb":          int(row["storage_gb"]),
                "ram_gb":              int(row["ram_gb"]),
                "display_size_inches": display,
                "refresh_rate_hz":     int(row["refresh_rate_hz"]),
                "camera_nanoreview":   nanoreview,
            },

            "scores": {
                "os_rom":   {"points": os_score,    "max": 25,  "note": os_label},
                "battery":  {"points": bat_score,   "max": 23,  "note": f"{battery} mAh"},
                "price":    {"points": price_score, "max": 10,  "note": f"${price}"},
                "storage":  {"points": stor_score,  "max": 20,  "note": f"{int(row['storage_gb'])} GB"},
                "charging": {"points": chg_score,   "max": 20,  "note": f"{charging} W"},
                "display":  {"points": disp_score,  "max": 12,  "note": f"{display}\""},
                "camera":   {"points": cam_score,   "max": 15,  "note": f"Nanoreview {nanoreview}"},
            },

            "total_score":  round(total, 1),
            "max_possible": max_score,
            "score_pct":    round((total / max_score) * 100, 1),
        })

ranked.sort(key=lambda x: x["total_score"], reverse=True)
for i, p in enumerate(ranked, 1):
    p["rank"] = i


# ── LLM-readable JSON ─────────────────────────────────────────────────────────

output = {
    "title": "Phone Recommendation Rankings",
    "context": "Built for a real purchase decision. Soft budget ~$1000. Global ROM preferred, not required.",
    "scoring_system": {
        "deal_breakers": [
            "Battery < 6500 mAh",
            "Charging < 90 W",
            "Display < 6.78 inches",
        ],
        "categories": {
            "os_rom":   "Global ROM = 25 pts | China ROM = 15 pts",
            "battery":  "Sweet spot 6500-7500 mAh → 0-20 pts (steep). Above 7500 mAh → 20-23 pts (compressed bonus)",
            "price":    "Max 10 pts. ≤$800 gentle slide | $800-$1000 moderate | >$1000 exponential decay, never excluded",
            "storage":  "256 GB = 10 | 512 GB = 15 | 1 TB = 20",
            "charging": "90 W = 5 | 100 W = 10 | 120 W = 20 (heavily skewed toward 120 W)",
            "display":  "6.78-6.89\" = 10 | 6.9\"+ = 12",
            "camera":   "Nanoreview composite score (0-100) → 0-15 pts. 70=5pts, 85=10pts, 95=13pts, 100=15pts",
        },
        "ceilings": {"global_rom": 105, "china_rom": 95},
    },
    "summary": {
        "total_evaluated": len(ranked) + len(excluded),
        "qualified":       len(ranked),
        "excluded":        len(excluded),
    },
    "excluded_phones": excluded,
    "quick_top5": [
        {
            "rank":            p["rank"],
            "model":           p["model"],
            "os_type":         p["os_type"],
            "score":           f"{p['total_score']}/{p['max_possible']} ({p['score_pct']}%)",
            "price_usd":       p["specs"]["price_usd"],
            "battery_mAh":     p["specs"]["battery_mAh"],
            "charging_W":      p["specs"]["charging_W"],
            "camera_nanoreview": p["specs"]["camera_nanoreview"],
        }
        for p in ranked[:5]
    ],
    "ranked_phones": ranked,
}

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "Rank", "Model", "OS",
        "Total", "Max", "Pct%",
        "OS_pts", "Bat_pts", "Price_pts", "Stor_pts",
        "Chg_pts", "Disp_pts", "Cam_pts",
        "Price_$", "Battery_mAh", "Charging_W", "Storage_GB",
        "Display_in", "Nanoreview",
    ])
    for p in ranked:
        s = p["scores"]; sp = p["specs"]
        writer.writerow([
            p["rank"], p["model"], p["os_type"],
            p["total_score"], p["max_possible"], p["score_pct"],
            s["os_rom"]["points"], s["battery"]["points"], s["price"]["points"],
            s["storage"]["points"], s["charging"]["points"],
            s["display"]["points"], s["camera"]["points"],
            sp["price_usd"], sp["battery_mAh"], sp["charging_W"],
            sp["storage_gb"], sp["display_size_inches"], sp["camera_nanoreview"],
        ])

# ── Console ───────────────────────────────────────────────────────────────────

print("\n" + "=" * 64)
print("RANKINGS")
print("=" * 64)
for p in ranked:
    s = p["scores"]; sp = p["specs"]
    bar = "█" * int(p["score_pct"] / 5)
    print(f"\n{p['rank']:2}. {p['model']}  [{p['os_type'].upper()}]")
    print(f"    {p['total_score']}/{p['max_possible']}  ({p['score_pct']}%)  {bar}")
    print(f"    ${sp['price_usd']}  |  {sp['battery_mAh']} mAh  |  {sp['charging_W']} W  |  {sp['storage_gb']} GB  |  {sp['display_size_inches']}\"  |  NR:{sp['camera_nanoreview']}")
    print(f"    OS:{s['os_rom']['points']}  bat:{s['battery']['points']}  price:{s['price']['points']}  "
          f"stor:{s['storage']['points']}  chg:{s['charging']['points']}  "
          f"disp:{s['display']['points']}  cam:{s['camera']['points']}")

if excluded:
    print(f"\n{'─'*64}")
    print(f"Excluded ({len(excluded)}):")
    for e in excluded:
        print(f"  x {e['model']}: {'; '.join(e['reasons'])}")

print(f"\nSaved: {OUT_JSON}")
print(f"Saved: {OUT_CSV}")