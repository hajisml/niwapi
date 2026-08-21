import base64
import hashlib
import json
import os

import httpx

BLOCKAGE_TYPES = [
    "Plastic / solid waste",
    "Silt / debris",
    "Vegetation",
    "Structural damage",
    "Other",
]

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
)

PROMPT = (
    "You are triaging a citizen photo of a stormwater drain/culvert for a flood-risk platform. "
    "Classify the blockage. Respond with ONLY a JSON object, no markdown fences, no prose: "
    '{"blockage_type": one of ' + json.dumps(BLOCKAGE_TYPES) + ", "
    '"severity": integer 1-3 (1=minor, 3=severe), "confidence": float 0-1}.'
)


def _mock_classification(image_bytes: bytes) -> dict:
    digest = hashlib.sha256(image_bytes).digest()
    blockage_type = BLOCKAGE_TYPES[digest[0] % len(BLOCKAGE_TYPES)]
    severity = (digest[1] % 3) + 1
    return {"blockage_type": blockage_type, "severity": severity, "confidence": 0.5}


def _parse_json_response(text: str) -> dict:
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(cleaned)
    blockage_type = data["blockage_type"]
    severity = int(data["severity"])
    if blockage_type not in BLOCKAGE_TYPES or not (1 <= severity <= 3):
        raise ValueError("Gemini response out of expected range")
    return {
        "blockage_type": blockage_type,
        "severity": severity,
        "confidence": float(data.get("confidence", 0.7)),
    }


def classify_blockage(image_bytes: bytes, content_type: str | None) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return _mock_classification(image_bytes)

    try:
        response = httpx.post(
            GEMINI_URL,
            params={"key": api_key},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": PROMPT},
                            {
                                "inline_data": {
                                    "mime_type": content_type or "image/jpeg",
                                    "data": base64.b64encode(image_bytes).decode("ascii"),
                                }
                            },
                        ]
                    }
                ]
            },
            timeout=10,
        )
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return _parse_json_response(text)
    except Exception:
        return _mock_classification(image_bytes)
