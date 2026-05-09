import os
from pymongo import MongoClient
from dotenv import load_dotenv
from models.PhotoModel import Photo
from storage.az import AzureStorageManager
from io import BytesIO

# Load environment variables with explicit path
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))




class DatabaseManager:
    def __init__(self):
        self.storage_container_name = os.getenv("AZURE_STORAGE_CONTAINER_NAME")
        db_name = os.getenv("MONGO_COLLECTION_NAME")

        self.az = AzureStorageManager(self.storage_container_name) # Initialize Azure Storage Manager
        conn = os.getenv("MONGO_CONNECTION_STRING")
        self.client = MongoClient(conn)
        self.db = self.client[db_name]
        print(f'Connected to MongoDB database: {db_name}\n') 
        self.photo = self.db['Photo'] # Get the Photo collection from the database

    def query(self, query):
        #collection = self.db[collection_name]
        return list(self.photo.find(query))

    def insert(self, collection_name, document):
        #collection = self.db[collection_name]
        self.photo.insert_one(document)
        #result = collection.insert_one(document)
        #return result.inserted_id

    def close(self):
        self.client.close()
        

    async def addPhoto(self, files, description, tags): # Cretes a new photo in the database - CREATE
        from utils.heic_converter import convert_heic_to_jpeg, is_heic_file, get_jpeg_filename
        from utils.thumbnail_generator import generate_thumbnail
        
        for file in files:
            print(f"Processing file: {file.filename}")

            data = await file.read()
            original_filename = file.filename
            
            # Convert HEIC to JPEG if needed
            if is_heic_file(original_filename):
                print(f"Converting HEIC file: {original_filename}")
                data = convert_heic_to_jpeg(data, quality=90)
                file.filename = get_jpeg_filename(original_filename)
                print(f"Converted to JPEG: {file.filename}")
            
            newPhoto = Photo(data)  # Create a new Photo object from bytes
            newPhoto.filename = file.filename  # Set the correct filename
            
            # Debug GPS extraction
            print(f"Photo location after creation: {newPhoto.location}")
            if newPhoto.location is None:
                print("No GPS data found in photo - checking if EXIF exists...")
                try:
                    from PIL import Image
                    import io
                    with Image.open(io.BytesIO(data)) as img:
                        exif = img.getexif()
                        print(f"EXIF data available: {len(exif) > 0}")
                        if len(exif) > 0:
                            print(f"EXIF keys: {list(exif.keys())[:10]}...")  # Show first 10 keys
                except Exception as e:
                    print(f"Error checking EXIF: {e}")
            
            # Generate thumbnail
            print(f"Generating thumbnail for {file.filename}")
            thumbnail_data = generate_thumbnail(data, size=(200, 200), quality=85)

            if description:
                newPhoto.description = description
            if tags:
                newPhoto.tags = tags.split(",")  # Assuming tags are comma-separated should be a list
                
            if self.exists('Photo', {'_id': newPhoto.id}):  # Check if photo already exists
                print(f"Photo with id {newPhoto.id} already exists. Skipping insertion.")
                continue
            
            # Upload full image to Azure Blob Storage
            self.az.upload_bytes(data, newPhoto.id, content_type=newPhoto.content_type)
            blob_url = self.az.container_client.get_blob_client(newPhoto.id).url
            newPhoto.url = blob_url
            
            # Upload thumbnail to Azure Blob Storage
            thumbnail_id = f"{newPhoto.id}_thumb"
            self.az.upload_bytes(thumbnail_data, thumbnail_id, content_type='image/jpeg')
            thumbnail_url = self.az.container_client.get_blob_client(thumbnail_id).url
            newPhoto.thumbnail = thumbnail_url
            print(f"Thumbnail uploaded: {thumbnail_url}")
            
            doc = newPhoto.to_dict()
            self.photo.insert_one(doc)  # If it doesn't, add the photo
            print(f"Added photo: {newPhoto} with _id {newPhoto.id}")

    def getPhotos(self, query): # Gets photos from the database - READ
        photos = self.query(query)
        
        # Normalize photos to ensure tags field always exists
        for photo in photos:
            if 'tags' not in photo or photo['tags'] is None:
                photo['tags'] = []
        
        print(f"Found photos: {photos}")
        return photos

    def getPhotosPaginated(self, query, page=1, limit=20, sort_by="timestamp", order="desc", year=None, month=None, tags=None, start_date=None, end_date=None):
        """
        Get paginated photos from database with optional filtering
        
        Args:
            query: MongoDB query filter
            page: Page number (1-indexed)
            limit: Items per page
            sort_by: Field to sort by
            order: 'asc' or 'desc'
            year: Optional year filter (int)
            month: Optional month filter (int, 1-12)
            tags: Optional list of tags to filter by
            start_date: Optional start date string (YYYY-MM-DD)
            end_date: Optional end date string (YYYY-MM-DD)
        
        Returns:
            dict with photos and pagination info
        """
        from datetime import datetime, timedelta
        
        try:
            # Build filter conditions
            filter_conditions = []
            
            # Add existing query if not empty
            if query:
                filter_conditions.append(query)
            
            # Add date range filtering - prioritize exact dates over year/month
            if start_date or end_date:
                # Use exact date range if provided
                date_filter = {}
                if start_date:
                    # Parse start date and set to beginning of day
                    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                    date_filter["$gte"] = start_dt
                if end_date:
                    # Parse end date and set to end of day
                    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                    # Add one day and use $lt to include the entire end date
                    end_dt = end_dt + timedelta(days=1)
                    date_filter["$lt"] = end_dt
                
                if date_filter:
                    filter_conditions.append({"timestamp": date_filter})
            elif year is not None:
                # Fall back to year/month filtering if no exact dates
                if month is not None:
                    # Filter by specific year and month
                    start_date_dt = datetime(year, month, 1)
                    # Calculate next month for end date
                    if month == 12:
                        end_date_dt = datetime(year + 1, 1, 1)
                    else:
                        end_date_dt = datetime(year, month + 1, 1)
                else:
                    # Filter by year only
                    start_date_dt = datetime(year, 1, 1)
                    end_date_dt = datetime(year + 1, 1, 1)
                
                filter_conditions.append({
                    "timestamp": {
                        "$gte": start_date_dt,
                        "$lt": end_date_dt
                    }
                })
            
            # Add tag filtering
            if tags is not None and len(tags) > 0:
                filter_conditions.append({
                    "tags": {"$in": tags}
                })
            
            # Combine filters using $and if multiple conditions exist
            if len(filter_conditions) > 1:
                final_query = {"$and": filter_conditions}
            elif len(filter_conditions) == 1:
                final_query = filter_conditions[0]
            else:
                final_query = {}
            
            # Calculate skip
            skip = (page - 1) * limit
            
            # Determine sort direction
            sort_direction = -1 if order == "desc" else 1
            
            # Get total count
            total = self.photo.count_documents(final_query)
            
            # Get paginated photos with error handling for missing sort field
            try:
                cursor = self.photo.find(final_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
                photos = list(cursor)
            except Exception as sort_error:
                # Fallback: sort by _id if sort field doesn't exist
                print(f"Sort error on {sort_by}, falling back to _id: {sort_error}")
                cursor = self.photo.find(final_query).sort("_id", sort_direction).skip(skip).limit(limit)
                photos = list(cursor)
            
            # Normalize photos to ensure tags field always exists
            for photo in photos:
                if 'tags' not in photo or photo['tags'] is None:
                    photo['tags'] = []
            
            # Calculate pagination info
            pages = max(1, (total + limit - 1) // limit)  # Ceiling division, minimum 1
            has_next = page < pages
            has_prev = page > 1
            
            print(f"Found {len(photos)} photos (page {page}/{pages})")
            
            return {
                'photos': photos,
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages,
                'has_next': has_next,
                'has_prev': has_prev
            }
        except Exception as e:
            print(f"Error in getPhotosPaginated: {e}")
            # Return empty result on error
            return {
                'photos': [],
                'page': page,
                'limit': limit,
                'total': 0,
                'pages': 1,
                'has_next': False,
                'has_prev': False
            }

    def getAllTags(self):
        """
        Get all unique tags from the photo collection
        
        Returns:
            list: Sorted list of unique tag strings, excluding null/empty values
        """
        try:
            # MongoDB aggregation pipeline to extract unique tags
            pipeline = [
                # Unwind the tags array to create a document for each tag
                {"$unwind": "$tags"},
                # Group by tag to get unique values
                {"$group": {"_id": "$tags"}},
                # Sort alphabetically
                {"$sort": {"_id": 1}}
            ]
            
            # Execute aggregation
            result = list(self.photo.aggregate(pipeline))
            
            # Extract tags and filter out null, empty, or whitespace-only values
            tags = []
            for doc in result:
                tag = doc.get("_id")
                if tag and isinstance(tag, str) and tag.strip():
                    tags.append(tag)
            
            print(f"Found {len(tags)} unique tags")
            return tags
            
        except Exception as e:
            print(f"Error in getAllTags: {e}")
            return []

    def getPhotosList(self, payload: list):
        photos = []
        for id in payload:
            photo = self.getPhoto({'_id': id})
            if photo:
                # Normalize photo to ensure tags field always exists
                if 'tags' not in photo or photo['tags'] is None:
                    photo['tags'] = []
                photos.append(photo)
        print(f"Found photos: {photos}")
        return photos



    def getPhoto(self, query):
        results = self.query(query)
        if not results:
            return None
        photo = results[0]  # Return a single document
        
        # Normalize photo to ensure tags field always exists
        if 'tags' not in photo or photo['tags'] is None:
            photo['tags'] = []
        
        return photo



    def updatePhoto(self, photo: Photo): # Updates a photo in the database - UPDATE
        # if cover is different or number of chapters is different, update
        self.photo.update_one({'id': photo.id}, {'$set': photo})
        print(f"Updated photo: {photo.filename} with id {photo.id}")


    def updatePhoto(self, photo_id: str, description=None, tags=None, append=False):
        update_fields = {}
        if description is not None:
            update_fields["description"] = description
        if tags is not None:
            if append:
                self.photo.update_one(
                    {"_id": photo_id},
                    {"$addToSet": {"tags": {"$each": tags}}}
                )
                return
            update_fields["tags"] = tags

        if update_fields:
            self.photo.update_one({"_id": photo_id}, {"$set": update_fields})



    def deletePhoto(self, id):  # id is a string
        """Deletes both the Mongo document and the Azure blob."""
        # find the document
        photo = self.getPhoto({'_id': id})
        if not photo:
            print(f"Photo with id {id} not found")
            return False

        # delete from Mongo
        self.photo.delete_one({'_id': id})
        print(f"Deleted MongoDB record for {id}")

        # delete from Azure - both main image and thumbnail
        try:
            # Delete main image
            self.az.delete_blob(id)
            print(f"Deleted Azure blob for {id}")
            
            # Delete thumbnail (if it exists)
            try:
                self.az.delete_blob(f"{id}_thumb")
                print(f"Deleted Azure thumbnail for {id}")
            except Exception as thumb_e:
                print(f"Thumbnail delete failed for {id} (may not exist): {thumb_e}")
                
        except Exception as e:
            print(f"Azure delete failed for {id}: {e}")

        print(f"Deleted photo: {photo['filename']} with id {id}")
        return True





    def exists(self, collection_name, query): # Checks if a document exists in the database, return boolean
        collection = self.db[collection_name]
        return collection.find_one(query) != None