"""
HEIC to JPEG Conversion Utility
Handles conversion of HEIC images to JPEG format with metadata preservation
"""

import io
from PIL import Image
from pillow_heif import register_heif_opener

# Register HEIF opener with Pillow
register_heif_opener()


def convert_heic_to_jpeg(heic_data: bytes, quality: int = 90) -> bytes:
    """
    Convert HEIC image data to JPEG format with full metadata preservation
    
    Args:
        heic_data: Raw HEIC image bytes
        quality: JPEG quality (1-100), default 90
        
    Returns:
        bytes: JPEG image data with preserved EXIF and metadata
    """
    # Open HEIC image
    image = Image.open(io.BytesIO(heic_data))
    
    # Extract all metadata before conversion
    # Try to get raw EXIF bytes first (most comprehensive)
    exif_bytes = image.info.get('exif')
    
    # Fallback to getexif() if raw bytes not available
    exif_data = None
    if not exif_bytes:
        try:
            exif_data = image.getexif()
        except Exception as e:
            print(f"Warning: Could not extract EXIF data: {e}")
    
    # Convert to RGB if necessary (HEIC can have different color modes)
    if image.mode not in ('RGB', 'L'):
        image = image.convert('RGB')
    
    # Save as JPEG with all metadata preserved
    output = io.BytesIO()
    save_kwargs = {
        'format': 'JPEG',
        'quality': quality,
        'optimize': True
    }
    
    # Use raw EXIF bytes if available (preserves everything)
    if exif_bytes:
        save_kwargs['exif'] = exif_bytes
    elif exif_data:
        save_kwargs['exif'] = exif_data
    
    image.save(output, **save_kwargs)
    output.seek(0)
    
    return output.getvalue()


def is_heic_file(filename: str) -> bool:
    """
    Check if filename is a HEIC file
    
    Args:
        filename: Name of the file
        
    Returns:
        bool: True if HEIC file
    """
    return filename.lower().endswith(('.heic', '.heif'))


def get_jpeg_filename(heic_filename: str) -> str:
    """
    Convert HEIC filename to JPEG filename
    
    Args:
        heic_filename: Original HEIC filename
        
    Returns:
        str: New JPEG filename
    """
    # Remove HEIC extension and add JPEG
    base_name = heic_filename.rsplit('.', 1)[0]
    return f"{base_name}.jpg"
