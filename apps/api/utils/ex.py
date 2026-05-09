import os
import zipfile
import simplekml
import tempfile
import datetime
import requests

from routes.photos import DB



class ExportManager:
    def __init__(self):
        self.az = DB.az  # Use the AzureStorageManager from DatabaseManager
        # Use absolute URLs for icons so they work in KML/KMZ files
        self.base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.defaultIcon = f"{self.base_url}/assets/hwc-map-icon.png"
        self.blueIcon = f"{self.base_url}/assets/hwc-map-icon-blue.png"
        self.greenIcon = f"{self.base_url}/assets/hwc-map-icon-green.png"

    # ---------- Helpers ----------
    def _make_style(self, kml, icon_path, scale):
        style = simplekml.Style()
        style.iconstyle.icon.href = icon_path
        style.iconstyle.scale = scale
        return style

    def _create_tmp(self, suffix: str) -> str:
        prefix = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        tmp = tempfile.NamedTemporaryFile(delete=False, prefix=prefix, suffix=suffix)
        path = tmp.name
        tmp.close()
        return path

    # ---------- KMZ ----------
    def create_kmz(self, photos):
        kmz = simplekml.Kml()
        default = self._make_style(kmz, self.defaultIcon, 0.9)
        hover = self._make_style(kmz, self.blueIcon, 1.1)
        smap = simplekml.StyleMap()
        smap.normalstyle = default
        smap.highlightstyle = hover

        for photo in photos:
            blob_name = photo["_id"]
            url = self.az.generate_sas_url(blob_name, hours_valid=720)  # SAS URL valid 3 days

            coords = photo["location"]
            lon, lat, z = coords.get("lon"), coords.get("lat"), coords.get("z", 0)

            pnt = kmz.newpoint(name=photo["filename"], coords=[(lon, lat, z)])
            pnt.description = f"""
            <![CDATA[
                <div style="font-family:Arial;max-width:360px">
                    <img src="{url}" style="max-width:100%;height:auto;border:1px solid #ddd;border-radius:6px" />
                </div>
            ]]>
            """
            pnt.style.iconstyle.icon.href = url
            pnt.stylemap = smap

        output = self._create_tmp(".kmz")
        kmz.savekmz(output)
        return output

    # ---------- KML ----------
    def create_kml(self, photos):
        kml = simplekml.Kml()
        default = self._make_style(kml, self.defaultIcon, 0.9)
        hover = self._make_style(kml, self.blueIcon, 1.1)
        smap = simplekml.StyleMap()
        smap.normalstyle = default
        smap.highlightstyle = hover

        for photo in photos:
            blob_name = photo["_id"]
            url = self.az.generate_sas_url(blob_name, hours_valid=72)

            coords = photo["location"]
            lon, lat, z = coords.get("lon"), coords.get("lat"), coords.get("z", 0)

            pnt = kml.newpoint(name=photo["filename"], coords=[(lon, lat, z)])
            pnt.description = f"""
            <![CDATA[
                <div style="font-family:Arial;max-width:360px">
                    <img src="{url}" style="max-width:100%;height:auto;border:1px solid #ddd;border-radius:6px" />
                </div>
            ]]>
            """
            pnt.style.iconstyle.icon.href = url
            pnt.stylemap = smap

        output = self._create_tmp(".kml")
        kml.save(output)
        return output

    # ---------- ZIP ----------
    def create_zip(self, photos):
        zip_path = self._create_tmp(".zip")

        with zipfile.ZipFile(zip_path, "w") as zipf:
            for photo in photos:
                blob_name = photo["_id"]
                try:
                    url = self.az.generate_sas_url(blob_name, hours_valid=72)
                    response = requests.get(url)
                    response.raise_for_status()
                    zipf.writestr(photo["filename"], response.content)
                except Exception as e:
                    print(f"Error adding {blob_name}: {e}")

        return zip_path
