from fastapi import APIRouter, File, UploadFile, Form, HTTPException # Import the APIRouter class from fastapi
from storage.db import DatabaseManager # Import classes from MangaManager.py
from typing import Optional, List

DB = DatabaseManager() # Initialize the database manager
#DB.getPhoto() # Test the database connection


# Photos ROUTER

photo_router = APIRouter(
    prefix="/photos", # Set the prefix of the router
    tags=["Photos"], # Set the tag of the router
    responses={404: {"description": "Not found"}}, # Set the 404 response
) # Initialize the router


@photo_router.get('') # Index Route gets a list of all photos with pagination
async def get_all_photos(
    page: int = 1,
    limit: int = 20,
    sort_by: str = "timestamp",
    order: str = "desc",
    year: Optional[int] = None,
    month: Optional[int] = None,
    tags: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get paginated list of photos with optional filtering
    
    Args:
        page: Page number (default: 1)
        limit: Items per page (default: 20, max: 100)
        sort_by: Field to sort by (default: timestamp)
        order: Sort order - 'asc' or 'desc' (default: desc)
        year: Optional year filter (4-digit integer)
        month: Optional month filter (1-12, requires year)
        tags: Optional comma-separated tags filter
        start_date: Optional start date (YYYY-MM-DD format)
        end_date: Optional end date (YYYY-MM-DD format)
    """
    # Validate year parameter
    if year is not None and (year < 1000 or year > 9999):
        raise HTTPException(
            status_code=400,
            detail="Year must be a valid 4-digit integer"
        )
    
    # Validate month parameter
    if month is not None and (month < 1 or month > 12):
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )
    
    # Validate month requires year
    if month is not None and year is None:
        raise HTTPException(
            status_code=400,
            detail="Month filter requires year to be specified"
        )
    
    # Parse comma-separated tags into list
    tags_list = None
    if tags is not None:
        tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
    
    # Limit max items per page
    limit = min(limit, 100)
    
    # Get paginated photos with filters
    result = DB.getPhotosPaginated(
        query={},
        page=page,
        limit=limit,
        sort_by=sort_by,
        order=order,
        year=year,
        month=month,
        tags=tags_list,
        start_date=start_date,
        end_date=end_date
    )
    
    data = {
        "Message": "Successfully retrieved photos from database",
        'Photos': result['photos'],
        'pagination': {
            'page': result['page'],
            'limit': result['limit'],
            'total': result['total'],
            'pages': result['pages'],
            'has_next': result['has_next'],
            'has_prev': result['has_prev']
        }
    }

    return data

@photo_router.get('/tags') # Get all unique tags from photo collection
async def get_all_tags():
    """
    Get all unique tags from the photo collection
    
    Returns:
        JSON response with tags array and total count
    """
    try:
        tags = DB.getAllTags()
        
        data = {
            "Message": "Successfully retrieved tags",
            "tags": tags,
            "total": len(tags)
        }
        
        return data
    except Exception as e:
        print(f"Error retrieving tags: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving tags"
        )

@photo_router.get('/markers') # Get lightweight photo markers for map display
async def get_photo_markers(
    year: Optional[int] = None,
    month: Optional[int] = None,
    tags: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get minimal photo data for map markers (location, id, thumbnail only)
    Much faster than loading full photo data
    
    Args:
        year: Optional year filter (4-digit integer)
        month: Optional month filter (1-12, requires year)
        tags: Optional comma-separated tags filter
        start_date: Optional start date (YYYY-MM-DD format)
        end_date: Optional end date (YYYY-MM-DD format)
    """
    # Validate parameters (same as get_all_photos)
    if year is not None and (year < 1000 or year > 9999):
        raise HTTPException(
            status_code=400,
            detail="Year must be a valid 4-digit integer"
        )
    
    if month is not None and (month < 1 or month > 12):
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )
    
    if month is not None and year is None:
        raise HTTPException(
            status_code=400,
            detail="Month filter requires year to be specified"
        )
    
    # Parse tags
    tags_list = None
    if tags is not None:
        tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
    
    # Get filtered photos using the same filtering logic as get_all_photos
    # But we'll use getPhotosPaginated with a large limit to get all matching photos
    result = DB.getPhotosPaginated(
        query={},
        page=1,
        limit=10000,  # Large limit to get all markers
        sort_by="timestamp",
        order="desc",
        year=year,
        month=month,
        tags=tags_list,
        start_date=start_date,
        end_date=end_date
    )
    
    photos = result['photos']
    
    # Return only essential data for map markers
    markers = []
    for photo in photos:
        if photo.get('location'):  # Only include photos with GPS data
            markers.append({
                '_id': photo['_id'],
                'filename': photo['filename'],
                'location': photo['location'],
                'thumbnail': photo.get('thumbnail'),
                'timestamp': photo.get('timestamp'),
                'tags': photo.get('tags', [])
            })
    
    return {
        "Message": "Successfully retrieved photo markers",
        "markers": markers,
        "total": len(markers)
    }

@photo_router.post('/upload') # User uploads photo(s) then added to database
async def upload_photo(file: List[UploadFile] = File(...), description: Optional[str] = Form(None), tags: Optional[str] = Form(None)):
    uploads = await DB.addPhoto(file, description, tags)

    data = {
        "Message": f"Successfully uploaded {len(file)} photo(s) to database",
        'Photos': uploads,
        'total': len(file)
    }

    return data

@photo_router.get('/{id}') # Get a specific photo by ID
async def get_photo(id):
    data = DB.getPhoto({'_id': id})
    print(f"Retrieved photo: {data}")
    return data

@photo_router.put('/{id}/update') # Update a specific photo by ID
async def update_photo(id, description: Optional[str] = Form(None), tags: Optional[str] = Form(None)):
    """
    Update a photo's description and/or tags
    
    Args:
        id: Photo ID
        description: Optional new description
        tags: Optional comma-separated tags
    
    Returns:
        Success message with updated photo ID
    
    Raises:
        HTTPException: 404 if photo not found, 500 if database error
    """
    try:
        # Check if photo exists
        photo = DB.getPhoto({'_id': id})
        if not photo:
            raise HTTPException(
                status_code=404,
                detail=f"Photo with id {id} not found"
            )
        
        # Parse tags if provided
        tags_list = None
        if tags is not None:
            tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # Update photo
        DB.updatePhoto(photo_id=id, description=description, tags=tags_list)
        
        data = {
            "Message": f"Updated photo with id {id}"
        }
        return data
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        # Catch database errors and return 500
        print(f"Error updating photo {id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while updating the photo"
        )



@photo_router.delete('/{id}/delete') # Delete a specific photo by ID
async def delete_photo(id):
    DB.deletePhoto(id)
    data = {
        "Message": f"Deleted photo with id {id}"
    }
    return data
