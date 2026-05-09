from pydantic import BaseModel, Field


class RootResponse(BaseModel):
    """Response schema for GET / (root endpoint)"""
    Message: str = Field(..., description="Welcome message")
    Framework: str = Field(..., description="Framework being used")
    
    class Config:
        json_schema_extra = {
            "example": {
                "Message": "Connected to Photo Log Map API",
                "Framework": "FastAPI"
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response schema"""
    detail: str = Field(..., description="Error message describing what went wrong")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Photo not found"
            }
        }


class NotFoundResponse(BaseModel):
    """Response schema for 404 errors"""
    description: str = Field(default="Not found", description="Error description")
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Not found"
            }
        }
