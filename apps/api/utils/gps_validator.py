"""
GPS Coordinate Validation Utility
Validates GPS coordinates and filters invalid data
"""

def validate_gps_coordinates(lat, lon, z=None):
    """
    Validate GPS coordinates are within valid ranges and not (0,0)
    
    Args:
        lat: Latitude
        lon: Longitude
        z: Altitude (optional)
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    # Check for None values
    if lat is None or lon is None:
        return False, "Missing GPS coordinates"
    
    # Check for invalid (0,0) coordinates
    if lat == 0.0 and lon == 0.0:
        return False, "Invalid GPS coordinates (0,0) - likely missing GPS data"
    
    # Validate latitude range
    if not (-90 <= lat <= 90):
        return False, f"Latitude out of range: {lat} (must be between -90 and 90)"
    
    # Validate longitude range
    if not (-180 <= lon <= 180):
        return False, f"Longitude out of range: {lon} (must be between -180 and 180)"
    
    # Validate altitude if provided
    if z is not None:
        if not (-500 <= z <= 10000):  # Reasonable altitude range in meters
            return False, f"Altitude out of range: {z} (must be between -500 and 10000 meters)"
    
    return True, None


def sanitize_gps_data(location_dict):
    """
    Sanitize GPS data dictionary, converting invalid coordinates to None
    
    Args:
        location_dict: Dictionary with lat, lon, z keys
        
    Returns:
        dict or None: Sanitized location dict or None if invalid
    """
    if not location_dict:
        return None
    
    lat = location_dict.get('lat')
    lon = location_dict.get('lon')
    z = location_dict.get('z')
    
    is_valid, error = validate_gps_coordinates(lat, lon, z)
    
    if not is_valid:
        print(f"Invalid GPS data: {error}")
        return None
    
    return {
        'lat': lat,
        'lon': lon,
        'z': z
    }
