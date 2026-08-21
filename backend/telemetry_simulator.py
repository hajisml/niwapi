"""Minimal IoT telemetry simulator: streams slowly-drifting ultrasonic
clearance readings for a fixed set of Kisumu culvert sensors into the
running API, standing in for real hardware during the demo.

Run manually: uv run python telemetry_simulator.py
"""

import os
import random
import time

import httpx

API_BASE_URL = os.environ.get("VITE_API_BASE_URL") or os.environ.get("API_BASE_URL") or "http://localhost:8000"
INTERVAL_SECONDS = 5

SENSORS = [
    {"label": "Manyatta culvert sensor", "lat": -0.0850, "lng": 34.7700, "clearance_cm": 45.0},
    {"label": "Kondele culvert sensor", "lat": -0.0950, "lng": 34.7650, "clearance_cm": 40.0},
    {"label": "Nyalenda culvert sensor", "lat": -0.1100, "lng": 34.7550, "clearance_cm": 50.0},
    {"label": "Obunga culvert sensor", "lat": -0.0800, "lng": 34.7450, "clearance_cm": 30.0},
]


def drift(sensor: dict) -> float:
    # Mostly siltation (clearance shrinking), occasional clearing.
    delta = random.uniform(-1.5, 0.5)
    sensor["clearance_cm"] = max(2.0, sensor["clearance_cm"] + delta)
    return round(sensor["clearance_cm"], 1)


def main():
    print(f"Streaming simulated telemetry to {API_BASE_URL}/sensors/telemetry (Ctrl+C to stop)")
    with httpx.Client(timeout=5) as client:
        while True:
            for sensor in SENSORS:
                payload = {
                    "label": sensor["label"],
                    "latitude": sensor["lat"],
                    "longitude": sensor["lng"],
                    "clearance_distance": drift(sensor),
                }
                try:
                    client.post(f"{API_BASE_URL}/sensors/telemetry", json=payload)
                    print(f"  {sensor['label']}: {payload['clearance_distance']} cm")
                except httpx.HTTPError as exc:
                    print(f"  {sensor['label']}: failed to post ({exc})")
            time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
