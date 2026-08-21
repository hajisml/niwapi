import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def forecasted_rainfall_mm(latitude: float, longitude: float) -> float:
    """Next-24h precipitation forecast in mm. Falls back to 0 if Open-Meteo is
    unreachable or slow, so one flaky third party can never hang report intake."""
    try:
        response = httpx.get(
            OPEN_METEO_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": "precipitation_sum",
                "forecast_days": 1,
                "timezone": "auto",
            },
            timeout=8,
        )
        response.raise_for_status()
        values = response.json().get("daily", {}).get("precipitation_sum", [])
        return float(values[0]) if values else 0.0
    except Exception:
        return 0.0
