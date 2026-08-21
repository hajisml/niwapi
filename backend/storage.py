import os
import uuid
from pathlib import Path

import httpx

MEDIA_DIR = Path(__file__).parent / "media"


def _extension(content_type: str | None) -> str:
    mapping = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    return mapping.get(content_type or "", ".jpg")


class LocalStorage:
    def __init__(self):
        MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    def save_image(self, data: bytes, content_type: str | None, public_base_url: str) -> str:
        filename = f"{uuid.uuid4().hex}{_extension(content_type)}"
        (MEDIA_DIR / filename).write_bytes(data)
        return f"{public_base_url.rstrip('/')}/media/{filename}"


class SupabaseStorage:
    BUCKET = "report-photos"

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key

    def save_image(self, data: bytes, content_type: str | None, public_base_url: str) -> str:
        filename = f"{uuid.uuid4().hex}{_extension(content_type)}"
        object_path = f"{self.BUCKET}/{filename}"
        response = httpx.post(
            f"{self.url}/storage/v1/object/{object_path}",
            content=data,
            headers={
                "Authorization": f"Bearer {self.key}",
                "apikey": self.key,
                "Content-Type": content_type or "image/jpeg",
            },
            timeout=10,
        )
        response.raise_for_status()
        return f"{self.url}/storage/v1/object/public/{object_path}"


def get_storage():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if supabase_url and supabase_key:
        return SupabaseStorage(supabase_url, supabase_key)
    return LocalStorage()
