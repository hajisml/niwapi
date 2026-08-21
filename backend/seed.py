"""One-shot demo data seed across Kisumu flood hotspots. Safe to re-run; it
inserts a fresh batch each time rather than upserting (reports have no
natural key), so only run this once per demo database."""

import os

from dotenv import load_dotenv

import db
import risk

HOTSPOTS = [
    {"name": "Manyatta", "lat": -0.0850, "lng": 34.7700},
    {"name": "Kondele", "lat": -0.0950, "lng": 34.7650},
    {"name": "Nyalenda", "lat": -0.1100, "lng": 34.7550},
    {"name": "Obunga", "lat": -0.0800, "lng": 34.7450},
]

DEMO_REPORTS = [
    {"hotspot": 0, "severity": 3, "blockage_type": "Structural damage", "rainfall": 18.0, "details": "Culvert collapsed, water pooling across the road."},
    {"hotspot": 1, "severity": 2, "blockage_type": "Plastic / solid waste", "rainfall": 6.0, "details": "Plastic waste choking the inlet grate."},
    {"hotspot": 2, "severity": 1, "blockage_type": "Silt / debris", "rainfall": 2.0, "details": "Light silt buildup, still draining."},
    {"hotspot": 3, "severity": 3, "blockage_type": "Vegetation", "rainfall": 22.0, "details": "Overgrown vegetation blocking channel ahead of forecast storm."},
]


def seed():
    load_dotenv(dotenv_path="../.env")
    if not os.environ.get("DATABASE_URL"):
        print("Error: DATABASE_URL not set.")
        return

    for item in DEMO_REPORTS:
        spot = HOTSPOTS[item["hotspot"]]
        culvert_importance = 3 if item["severity"] == 3 else 2
        score = risk.vulnerability_score(item["severity"], culvert_importance, item["rainfall"])
        level = risk.risk_level(score)
        db.fetch_one(
            """
            INSERT INTO reports
                (location, severity, blockage_type, details, culvert_importance,
                 forecasted_rainfall_mm, risk_score, risk_level, status)
            VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
            """,
            (
                spot["lng"],
                spot["lat"],
                item["severity"],
                item["blockage_type"],
                item["details"],
                culvert_importance,
                item["rainfall"],
                score,
                level,
            ),
        )
        print(f"Seeded report at {spot['name']}: {level} ({score:.1f})")

    for spot in HOTSPOTS:
        db.fetch_one(
            """
            INSERT INTO sensors (label, location, clearance_distance, last_reading)
            VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, now())
            ON CONFLICT (label) DO UPDATE
                SET location = EXCLUDED.location, clearance_distance = EXCLUDED.clearance_distance, last_reading = now()
            RETURNING id
            """,
            (f"{spot['name']} culvert sensor", spot["lng"], spot["lat"], 45.0),
        )
        print(f"Seeded sensor at {spot['name']}")


if __name__ == "__main__":
    seed()
