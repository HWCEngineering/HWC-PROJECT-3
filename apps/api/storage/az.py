import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from azure.storage.blob import (
    BlobServiceClient,
    ContentSettings,
    generate_blob_sas,
    BlobSasPermissions,
)

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class AzureStorageManager:
    def __init__(self, container_name: str):
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        print(f"Azure connection string loaded: {connection_string is not None}")
        if connection_string is None:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable not found")
        
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_client = self.blob_service_client.get_container_client(container_name)

        # Create private container if it doesn’t exist
        try:
            self.container_client.get_container_properties()
        except Exception:
            # no public access
            self.container_client.create_container()
        print(f"Connected to private Azure container: {container_name}")

    # ---------- Upload ----------
    def upload_file(self, file_path: str, blob_name: str):
        with open(file_path, "rb") as data:
            self.container_client.upload_blob(name=blob_name, data=data)
        print(f"Uploaded {file_path} as blob {blob_name}")

    def upload_bytes(
        self,
        data: bytes,
        blob_name: str,
        content_type: str | None = None,
        overwrite: bool = True,
    ):
        """Uploads bytes and applies content type"""
        self.container_client.upload_blob(
            name=blob_name,
            data=data,
            overwrite=overwrite,
            content_settings=ContentSettings(content_type=content_type)
            if content_type
            else None,
        )

    # ---------- SAS URL Generator ----------
    def generate_sas_url(self, blob_name: str, hours_valid: int = 72) -> str:
        """Return a time-limited SAS URL for a given blob."""
        account_name = self.blob_service_client.account_name
        account_key = self.blob_service_client.credential.account_key
        container_name = self.container_client.container_name

        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=container_name,
            blob_name=blob_name,
            account_key=account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=hours_valid),
        )

        return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"

    # ---------- Download / Delete ----------
    def download_file(self, blob_name: str, download_path: str):
        with open(download_path, "wb") as f:
            stream = self.container_client.download_blob(blob_name)
            f.write(stream.readall())
        print(f"Downloaded {blob_name} to {download_path}")
    
    def download_bytes(self, blob_name: str) -> bytes:
        """Download blob and return as bytes"""
        stream = self.container_client.download_blob(blob_name)
        return stream.readall()

    def delete_blob(self, blob_name: str):
        self.container_client.delete_blob(blob_name)
        print(f"Deleted blob {blob_name}")
