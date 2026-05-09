"""
Thumbnail Generation Utility
Generates thumbnails for photos during upload
"""

import io
from PIL import Image


def generate_thumbnail(image_data: bytes, size: tuple = (200, 200), quality: int = 85) -> bytes:
    """
    Generate a thumbnail from image data
    
    Args:
        image_data: Raw image bytes
        size: Thumbnail size (width, height), default (200, 200)
        quality: JPEG quality (1-100), default 85
        
    Returns:
        bytes: Thumbnail image data
    """
    # Open image
    image = Image.open(io.BytesIO(image_data))
    
    # Convert to RGB if necessary (handles RGBA, P, etc.)
    if image.mode not in ('RGB', 'L'):
        image = image.convert('RGB')
    
    # Generate thumbnail (maintains aspect ratio)
    image.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Save as JPEG
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=quality, optimize=True)
    output.seek(0)
    
    return output.getvalue()
