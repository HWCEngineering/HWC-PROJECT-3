from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Photo Model - represents a single photo document
class Photo(BaseModel):
    """Schema for a photo document in the database"""
    id: str = Field(..., alias="_id", description="Unique identifier for the photo")
    filename: str = Field(..., description="Original filename of the photo")
    url: str = Field(..., description="URL to access the photo")
    thumbnail_url: Optional[str] = Field(None, description="URL to access the thumbnail")
    description: Optional[str] = Field(None, description="User-provided description of the photo")
    tags: Optional[List[str]] = Field(None, description="List of tags associated with the photo")
    latitude: Optional[float] = Field(None, description="GPS latitude coordinate")
    longitude: Optional[float] = Field(None, description="GPS longitude coordinate")
    altitude: Optional[float] = Field(None, description="GPS altitude in meters")
    timestamp: Optional[datetime] = Field(None, description="When the photo was taken")
    uploaded_at: datetime = Field(..., description="When the photo was uploaded to the system")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type of the photo")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "filename": "DJI_0025.JPG",
                "url": "https://storage.example.com/photos/DJI_0025.JPG",
                "thumbnail_url": "https://storage.example.com/thumbnails/DJI_0025_thumb.JPG",
                "description": "Aerial view of the construction site",
                "tags": ["drone", "construction", "aerial"],
                "latitude": 40.7128,
                "longitude": -74.0060,
                "altitude": 120.5,
                "timestamp": "2024-03-15T14:30:00Z",
                "uploaded_at": "2024-03-15T15:00:00Z",
                "file_size": 2048576,
                "mime_type": "image/jpeg"
            }
        }


# Response Models

class GetAllPhotosResponse(BaseModel):
    """Response schema for GET /photos/"""
    Message: str = Field(..., description="Status message")
    Photos: List[Photo] = Field(..., description="List of all photos")
    total: int = Field(..., description="Total number of photos")
    
    class Config:
        json_schema_extra = {
            "example": {
                "Message": "Successfully retrieved a list of photos from database",
                "Photos": [
                    {
                        "_id": "507f1f77bcf86cd799439011",
                        "filename": "DJI_0025.JPG",
                        "url": "https://storage.example.com/photos/DJI_0025.JPG",
                        "description": "Aerial view",
                        "tags": ["drone", "aerial"],
                        "latitude": 40.7128,
                        "longitude": -74.0060,
                        "uploaded_at": "2024-03-15T15:00:00Z"
                    }
                ],
                "total": 1
            }
        }


class UploadPhotoResponse(BaseModel):
    """Response schema for POST /photos/upload"""
    Message: str = Field(..., description="Status message")
    Photos: List[Photo] = Field(..., description="List of uploaded photos")
    total: int = Field(..., description="Total number of photos uploaded")
    
    class Config:
        json_schema_extra = {
            "example": {
                "Message": "Successfully uploaded 2 photo(s) to database",
                "Photos": [
                    {
                        "_id": "507f1f77bcf86cd799439011",
                        "filename": "DJI_0025.JPG",
                        "url": "https://storage.example.com/photos/DJI_0025.JPG",
                        "uploaded_at": "2024-03-15T15:00:00Z"
                    }
                ],
                "total": 2
            }
        }


class GetPhotoResponse(Photo):
    """Response schema for GET /photos/{id}"""
    pass


class UpdatePhotoResponse(BaseModel):
    """Response schema for PUT /photos/{id}/update"""
    Message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "Message": "Updated photo with id 507f1f77bcf86cd799439011"
            }
        }


class DeletePhotoResponse(BaseModel):
    """Response schema for DELETE /photos/{id}/delete"""
    Message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "Message": "Deleted photo with id 507f1f77bcf86cd799439011"
            }
        }


# Request Models

class UploadPhotoRequest(BaseModel):
    """Request schema for POST /photos/upload"""
    file: List[str] = Field(..., description="List of photo files to upload (multipart/form-data)")
    description: Optional[str] = Field(None, description="Description for the photo(s)")
    tags: Optional[str] = Field(None, description="Comma-separated tags for the photo(s)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file": ["file1.jpg", "file2.jpg"],
                "description": "Construction site photos",
                "tags": "construction,progress,aerial"
            }
        }


class UpdatePhotoRequest(BaseModel):
    """Request schema for PUT /photos/{id}/update"""
    description: Optional[str] = Field(None, description="Updated description for the photo")
    tags: Optional[str] = Field(None, description="Updated comma-separated tags for the photo")
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Updated aerial view of construction site",
                "tags": "drone,construction,aerial,updated"
            }
        }
