from pydantic import BaseModel, Field
from typing import List


# Request Models

class ExportRequest(BaseModel):
    """Request schema for export endpoints"""
    payload: List[str] = Field(..., description="List of photo IDs to export")
    
    class Config:
        json_schema_extra = {
            "example": {
                "payload": [
                    "507f1f77bcf86cd799439011",
                    "507f1f77bcf86cd799439012",
                    "507f1f77bcf86cd799439013"
                ]
            }
        }


# Response Models

class ExportZipResponse(BaseModel):
    """Response schema for GET /export/zip
    
    Note: This endpoint returns a FileResponse with application/zip media type.
    The actual response is a binary ZIP file containing the requested photos.
    """
    content_type: str = Field(default="application/zip", description="Media type of the response")
    filename: str = Field(..., description="Name of the ZIP file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content_type": "application/zip",
                "filename": "photos_export_20240315.zip",
                "description": "Binary ZIP file containing the requested photos"
            }
        }


class ExportKMLResponse(BaseModel):
    """Response schema for GET /export/kml
    
    Note: This endpoint returns a FileResponse with application/vnd.google-earth.kml+xml media type.
    The actual response is a KML file that can be opened in Google Earth or other mapping applications.
    """
    content_type: str = Field(
        default="application/vnd.google-earth.kml+xml",
        description="Media type of the response"
    )
    filename: str = Field(..., description="Name of the KML file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content_type": "application/vnd.google-earth.kml+xml",
                "filename": "photos_export_20240315.kml",
                "description": "KML file containing photo locations and metadata"
            }
        }


class ExportKMZResponse(BaseModel):
    """Response schema for GET /export/kmz
    
    Note: This endpoint returns a FileResponse with application/vnd.google-earth.kmz media type.
    The actual response is a compressed KMZ file (zipped KML) that can be opened in Google Earth.
    """
    content_type: str = Field(
        default="application/vnd.google-earth.kmz",
        description="Media type of the response"
    )
    filename: str = Field(..., description="Name of the KMZ file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content_type": "application/vnd.google-earth.kmz",
                "filename": "photos_export_20240315.kmz",
                "description": "Compressed KMZ file containing photo locations and metadata"
            }
        }
