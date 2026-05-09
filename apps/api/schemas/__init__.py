"""
Response and Request Schemas for Photo Log Map API

These schemas are used for OpenAPI documentation to show what each endpoint
accepts and returns. They help frontend developers understand the API structure.
"""

from .photo_schemas import (
    Photo,
    GetAllPhotosResponse,
    UploadPhotoResponse,
    GetPhotoResponse,
    UpdatePhotoResponse,
    DeletePhotoResponse,
    UploadPhotoRequest,
    UpdatePhotoRequest,
)

from .export_schemas import (
    ExportRequest,
    ExportZipResponse,
    ExportKMLResponse,
    ExportKMZResponse,
)

from .common_schemas import (
    RootResponse,
    ErrorResponse,
    NotFoundResponse,
)

__all__ = [
    # Photo schemas
    "Photo",
    "GetAllPhotosResponse",
    "UploadPhotoResponse",
    "GetPhotoResponse",
    "UpdatePhotoResponse",
    "DeletePhotoResponse",
    "UploadPhotoRequest",
    "UpdatePhotoRequest",
    # Export schemas
    "ExportRequest",
    "ExportZipResponse",
    "ExportKMLResponse",
    "ExportKMZResponse",
    # Common schemas
    "RootResponse",
    "ErrorResponse",
    "NotFoundResponse",
]
