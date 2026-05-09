# helpers_bytes.py
from io import BytesIO
from PIL import Image, ImageOps
from PIL.ExifTags import TAGS, GPSTAGS
import exifread, re
from datetime import datetime

_M_TO_FT = 3.280839895013123

def _rf(x):
    try: return float(x.numerator) / float(x.denominator)
    except AttributeError: pass
    if isinstance(x, (tuple, list)) and len(x) == 2:
        return float(x[0]) / float(x[1])
    return float(x)

def extract_size_bytes(data: bytes):
    try:
        with Image.open(BytesIO(data)) as im:
            im2 = ImageOps.exif_transpose(im)
            w, h = im2.size
            return {"width": w, "height": h}
    except Exception:
        return None

def extract_timestamp_bytes(data: bytes):
    """
    Returns 'YYYY:MM:DD HH:MM:SS' (EXIF-style) if found, else None.
    Tries: EXIF via getexif(), EXIF via image.info['exif'], then XMP.
    """
    try:
        with Image.open(BytesIO(data)) as im:
            # 1) EXIF via Pillow
            ex = getattr(im, "getexif", lambda: None)() or {}
            raw = ex.get(36867) or ex.get(306)  # DateTimeOriginal or DateTime
            if raw:
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8", "ignore")
                return str(raw).strip()

            # 2) EXIF via raw exif bytes (HEIC path)
            exif_bytes = im.info.get("exif")
            if exif_bytes:
                try:
                    exif = piexif.load(exif_bytes)
                    val = (exif.get("Exif", {}) or {}).get(piexif.ExifIFD.DateTimeOriginal) \
                          or (exif.get("0th", {}) or {}).get(piexif.ImageIFD.DateTime)
                    if val:
                        if isinstance(val, bytes):
                            val = val.decode("utf-8", "ignore")
                        return str(val).strip()
                except Exception:
                    pass

            # 3) XMP fallback
            xmp = im.info.get("xmp")
    except Exception:
        xmp = None  # still try scanning raw bytes below

    # If Pillow didn't provide XMP, scan the bytes for the packet
    if not xmp and data:
        start = data.find(b"<x:xmpmeta")
        if start != -1:
            end = data.find(b"</x:xmpmeta>", start)
            if end != -1:
                xmp = data[start:end+12]

    if xmp:
        # Look for several common date tags
        for tag in (b"xmp:CreateDate", b"exif:DateTimeOriginal", b"photoshop:DateCreated", b"drone-dji:CreateDate"):
            m = re.search(tag + rb"[^>]*>([^<]+)<", xmp)
            if m:
                s = m.group(1).decode("utf-8", "ignore").strip()
                # Convert ISO → EXIF-style if needed
                if "T" in s and "-" in s:
                    try:
                        dt = datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
                        return dt.strftime("%Y:%m:%d %H:%M:%S")
                    except Exception:
                        return s
                return s

    return None

def extract_gps_bytes(data: bytes):
    try:
        with Image.open(BytesIO(data)) as im:
            exif = getattr(im, "_getexif", lambda: None)() or {}
            if not exif: return None
            exif_named = {TAGS.get(k, k): v for k, v in exif.items()}
            gps = exif_named.get("GPSInfo")
            if not gps: return None
            gps = {GPSTAGS.get(k, k): v for k, v in gps.items()}

            need = ("GPSLatitude","GPSLatitudeRef","GPSLongitude","GPSLongitudeRef")
            if not all(k in gps for k in need): return None

            lat_dms, lat_ref = gps["GPSLatitude"], str(gps["GPSLatitudeRef"]).upper()
            lon_dms, lon_ref = gps["GPSLongitude"], str(gps["GPSLongitudeRef"]).upper()
            lat = _rf(lat_dms[0]) + _rf(lat_dms[1]) / 60.0 + _rf(lat_dms[2]) / 3600.0
            lon = _rf(lon_dms[0]) + _rf(lon_dms[1]) / 60.0 + _rf(lon_dms[2]) / 3600.0
            if lat_ref == "S": lat = -lat
            if lon_ref == "W": lon = -lon

            z = None
            if "GPSAltitude" in gps:
                alt_m = _rf(gps["GPSAltitude"])
                alt_ref = int(gps.get("GPSAltitudeRef", 0) or 0)
                if alt_ref == 1: alt_m = -alt_m
                z = alt_m * _M_TO_FT

            location_data = {"lat": round(lat, 9), "lon": round(lon, 9), "z": None if z is None else round(z, 9)}
            
            # Validate GPS coordinates
            from utils.gps_validator import sanitize_gps_data
            return sanitize_gps_data(location_data)
    except Exception:
        return None

def _rf(x):
    try: return float(x.numerator) / float(x.denominator)
    except Exception: pass
    if isinstance(x, (tuple, list)) and len(x) == 2:
        return float(x[0]) / float(x[1])
    try: return float(x)
    except Exception: return 0.0

def _dms_to_dd(vals, ref):
    d = _rf(vals[0]); m = _rf(vals[1]); s = _rf(vals[2])
    dd = d + m/60.0 + s/3600.0
    if str(ref).upper() in ("S","W"): dd = -dd
    return round(dd, 9)

def _xmp_parse_number(s: str):
    s = s.strip()
    m = re.match(r"^\s*([+-]?\d+(?:\.\d+)?)\s*([NSEW])?\s*$", s, re.I)
    if m:
        val = float(m.group(1)); hemi = (m.group(2) or "").upper()
        if hemi in ("S","W"): val = -val
        return round(val, 9)
    parts = [p for p in re.split(r"[,\s]+", s) if p]
    hemi = parts[-1].upper() if parts and parts[-1].upper() in ("N","S","E","W") else ""
    nums = [float(p) for p in parts if re.match(r"^[+-]?\d+(\.\d+)?$", p)]
    if nums:
        d = nums[0]; m = nums[1] if len(nums)>1 else 0.0; sec = nums[2] if len(nums)>2 else 0.0
        dd = d + m/60.0 + sec/3600.0
        if hemi in ("S","W"): dd = -dd
        return round(dd, 9)
    return None

def _gps_from_exifread_bytes(data: bytes):
    try:
        tags = exifread.process_file(BytesIO(data), details=False, strict=True)
        lat = tags.get("GPS GPSLatitude");   lat_ref = tags.get("GPS GPSLatitudeRef")
        lon = tags.get("GPS GPSLongitude");  lon_ref = tags.get("GPS GPSLongitudeRef")
        if not (lat and lon and lat_ref and lon_ref): return None

        def vals(x):
            vs = getattr(x, "values", x)
            out = []
            for r in vs:
                try: out.append(float(r.num)/float(r.den))
                except Exception:
                    try: out.append(float(str(r)))
                    except Exception: out.append(0.0)
            while len(out) < 3: out.append(0.0)
            return out[:3]

        d1,m1,s1 = vals(lat); d2,m2,s2 = vals(lon)
        lat_dd = d1 + m1/60 + s1/3600
        lon_dd = d2 + m2/60 + s2/3600
        if str(lat_ref).upper().startswith("S"): lat_dd = -lat_dd
        if str(lon_ref).upper().startswith("W"): lon_dd = -lon_dd

        alt = None
        alt_tag = tags.get("GPS GPSAltitude"); alt_ref = tags.get("GPS GPSAltitudeRef")
        if alt_tag:
            try: alt_m = float(alt_tag.values[0].num)/float(alt_tag.values[0].den)
            except Exception: alt_m = float(str(alt_tag))
            if alt_ref and str(alt_ref).strip().startswith("1"): alt_m = -alt_m
            alt = round(alt_m * _M_TO_FT, 9)

        return {"lat": round(lat_dd, 9), "lon": round(lon_dd, 9), "z": alt}
    except Exception:
        return None

def _gps_from_pillow_bytes(data: bytes):
    try:
        from PIL.ExifTags import TAGS, GPSTAGS
        with Image.open(BytesIO(data)) as im:
            ex = getattr(im, "getexif", lambda: None)() or {}
            if not ex: return None
            named = {TAGS.get(k, k): v for k, v in ex.items()}
            gps = named.get("GPSInfo")
            if not gps: return None
            gps = {GPSTAGS.get(k, k): v for k, v in gps.items()}
            need = ("GPSLatitude","GPSLatitudeRef","GPSLongitude","GPSLongitudeRef")
            if not all(k in gps for k in need): return None
            lat = _dms_to_dd(gps["GPSLatitude"], gps["GPSLatitudeRef"])
            lon = _dms_to_dd(gps["GPSLongitude"], gps["GPSLongitudeRef"])
            alt = None
            if "GPSAltitude" in gps:
                alt_m = _rf(gps["GPSAltitude"])
                if int(gps.get("GPSAltitudeRef", 0) or 0) == 1: alt_m = -alt_m
                alt = round(alt_m * _M_TO_FT, 9)
            return {"lat": lat, "lon": lon, "z": alt}
    except Exception:
        return None

# XMP fallback for exif: and drone-dji: namespaces (note DJI's 'GpsLongtitude' misspelling)
_XMP_TAGS = [
    rb"exif:GPSLatitude", rb"exif:GPSLongitude", rb"exif:GPSAltitude",
    rb"drone-dji:GpsLatitude", rb"drone-dji:GpsLongtitude", rb"drone-dji:GpsLongitude",
    rb"drone-dji:AbsoluteAltitude", rb"drone-dji:RelativeAltitude"
]

def _gps_from_xmp_bytes(data: bytes):
    try:
        start = data.find(b"<x:xmpmeta")
        if start == -1: return None
        end = data.find(b"</x:xmpmeta>", start)
        if end == -1: return None
        pkt = data[start:end+12]

        def get_text(tag_regex):
            m = re.search(tag_regex + rb"[^>]*>([^<]+)<", pkt, re.I)
            return m.group(1).decode("utf-8","ignore").strip() if m else None

        lat_s = get_text(rb"(?:exif:GPSLatitude|drone-dji:GpsLatitude)")
        lon_s = get_text(rb"(?:exif:GPSLongitude|drone-dji:GpsLongitude|drone-dji:GpsLongtitude)")
        if not (lat_s and lon_s): return None

        lat = _xmp_parse_number(lat_s); lon = _xmp_parse_number(lon_s)
        if lat is None or lon is None: return None

        z = None
        alt_s = get_text(rb"(?:exif:GPSAltitude|drone-dji:AbsoluteAltitude|drone-dji:RelativeAltitude)")
        if alt_s:
            try:
                alt_m = float(alt_s)
                z = round(alt_m * _M_TO_FT, 9)
            except Exception:
                pass

        return {"lat": lat, "lon": lon, "z": z}
    except Exception:
        return None

def extract_gps_bytes(data: bytes):
    return (
        _gps_from_exifread_bytes(data)
        or _gps_from_pillow_bytes(data)
        or _gps_from_xmp_bytes(data)
    )
