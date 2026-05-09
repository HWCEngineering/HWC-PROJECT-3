from __future__ import annotations

import os
from uuid import uuid4
from datetime import datetime
from pathlib import Path
from io import BytesIO
from typing import Optional, Iterable

from PIL import Image, ImageOps
from PIL.ExifTags import TAGS, GPSTAGS

# Optional HEIC/HEIF
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except Exception:
    pass

_M_TO_FT = 3.280839895013123  # meters -> feet


# ---------- EXIF helpers ----------

def _rf(x) -> float:
    try:
        return float(x.numerator) / float(x.denominator)
    except AttributeError:
        pass
    if isinstance(x, (tuple, list)) and len(x) == 2:
        return float(x[0]) / float(x[1])
    return float(x)

def _exif_timestamp(im: Image.Image) -> Optional[datetime]:
    ex = getattr(im, "getexif", lambda: None)() or {}
    if not ex:
        return None
    raw = ex.get(36867) or ex.get(306)  # DateTimeOriginal, DateTime
    if not raw:
        return None
    if isinstance(raw, bytes):
        try:
            raw = raw.decode("utf-8", "ignore")
        except Exception:
            return None
    try:
        return datetime.strptime(str(raw).strip(), "%Y:%m:%d %H:%M:%S")
    except Exception:
        return None

def _exif_gps(im: Image.Image) -> Optional[dict]:
    ex = getattr(im, "getexif", lambda: None)() or {}
    if not ex:
        return None
    exif_named = {TAGS.get(k, k): v for k, v in ex.items()}
    gps = exif_named.get("GPSInfo")
    if not gps:
        return None
    gps = {GPSTAGS.get(k, k): v for k, v in gps.items()}

    need = ("GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef")
    if not all(k in gps for k in need):
        return None

    lat_dms, lat_ref = gps["GPSLatitude"], str(gps["GPSLatitudeRef"]).upper()
    lon_dms, lon_ref = gps["GPSLongitude"], str(gps["GPSLongitudeRef"]).upper()
    lat = _rf(lat_dms[0]) + _rf(lat_dms[1]) / 60 + _rf(lat_dms[2]) / 3600
    lon = _rf(lon_dms[0]) + _rf(lon_dms[1]) / 60 + _rf(lon_dms[2]) / 3600
    if lat_ref == "S": lat = -lat
    if lon_ref == "W": lon = -lon

    z = None
    if "GPSAltitude" in gps:
        alt_m = _rf(gps["GPSAltitude"])
        alt_ref = int(gps.get("GPSAltitudeRef", 0) or 0)
        if alt_ref == 1:
            alt_m = -alt_m
        z = alt_m * _M_TO_FT

    return {"lat": round(lat, 9), "lon": round(lon, 9), "z": None if z is None else round(z, 9)}


# ---------- The single-parameter Photo object ----------

class Photo:
    def __init__(self, file):
        self.id: str = str(uuid4())
        self.filename: str = "unknown"
        self.size: Optional[dict] = None             # {"width": int, "height": int}
        self.location: Optional[dict] = None         # {"lat": float, "lon": float, "z": float|None}
        self.timestamp: datetime = datetime.utcnow() # will be replaced by EXIF if available
        self.description: str = ""
        self.tags: list[str] = []
        self.url: Optional[str] = None
        self.thumbnail: Optional[str] = None
        self.content_type: Optional[str] = None
        self.size_bytes: Optional[int] = None

        self._ingest(file)

    # ----- Setters -----
    def set_description(self, text: Optional[str]):
        self.description = (text or "").strip()

    def set_tags(self, tags: Optional[Iterable[str]]):
        self.tags = [t.strip() for t in (tags or []) if t and t.strip()]

    def set_url(self, url: Optional[str]):
        self.url = url

    def set_content_type(self, content_type: Optional[str]):
        self.content_type = content_type

    # ----- Serialization for Mongo/API -----
    def to_dict(self) -> dict:
        return {
            "_id": self.id,
            "filename": self.filename,
            "size": self.size,
            "location": self.location,
            "description": self.description,
            "tags": self.tags,
            "timestamp": self.timestamp,
            "url": self.url,
            "thumbnail": self.thumbnail,
            "content_type": self.content_type,
            "size_bytes": self.size_bytes,
        }

    # ----- Internal ingestion -----
    def _ingest(self, file):
        # Case 1: path-like
        if isinstance(file, (str, Path)):
            path = Path(file)
            self.filename = path.name
            try:
                self.size_bytes = path.stat().st_size
            except Exception:
                pass
            self.content_type = _guess_content_type(self.filename)

            try:
                with Image.open(path) as im:
                    im2 = ImageOps.exif_transpose(im)     # ✅ respect EXIF orientation
                    w, h = im2.size
                    self.size = {"width": w, "height": h}
                    self.location = _exif_gps(im)
                    ts = _exif_timestamp(im)
                    if ts:
                        self.timestamp = ts
            except Exception:
                pass

            # fallback timestamp to file mtime if EXIF missing
            try:
                if self.timestamp is None:
                    self.timestamp = datetime.fromtimestamp(path.stat().st_mtime)
            except Exception:
                if self.timestamp is None:
                    self.timestamp = datetime.utcnow()
            return

        # Case 2: FastAPI UploadFile (sync context)
        if hasattr(file, "filename") and hasattr(file, "file"):
            self.filename = str(getattr(file, "filename") or "upload.bin")
            self.content_type = getattr(file, "content_type", None) or _guess_content_type(self.filename)
            try:
                data = file.file.read()  # sync read
            except Exception:
                data = b""
            self.size_bytes = len(data) if data else None
            self._populate_from_bytes(data)
            return

        # Case 3: raw bytes
        if isinstance(file, (bytes, bytearray, memoryview)):
            self.filename = "upload.bin"              # ✅ bytes don't have .filename
            self.content_type = None
            data = bytes(file)
            self.size_bytes = len(data)
            self._populate_from_bytes(data)
            return

        # Unknown type
        self.filename = "unknown.input"

    def _populate_from_bytes(self, data: bytes):
        if not data:
            return
        try:
            with Image.open(BytesIO(data)) as im:
                im2 = ImageOps.exif_transpose(im)     # ✅ respect EXIF orientation
                w, h = im2.size
                self.size = {"width": w, "height": h}
                
                # Use more robust GPS extraction from helpers_bytes
                from models.helpers_bytes import extract_gps_bytes
                self.location = extract_gps_bytes(data)
                
                ts = _exif_timestamp(im)
                if ts:
                    self.timestamp = ts
        except Exception:
            pass


# ---------- tiny helper ----------
def _guess_content_type(filename: str) -> str:
    f = filename.lower()
    if f.endswith((".jpg", ".jpeg")): return "image/jpeg"
    if f.endswith(".png"):            return "image/png"
    if f.endswith((".heic", ".heif")):return "image/heic"
    if f.endswith((".tif", ".tiff")): return "image/tiff"
    if f.endswith(".webp"):           return "image/webp"
    return "application/octet-stream"
