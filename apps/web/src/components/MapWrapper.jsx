import { useState, useEffect, useCallback } from 'react';
import { HwcMap } from '@hwc/map';

export function MapWrapper({
  mapTilerKey,
  mapboxToken,
  selectedPhotoIds = [],
  onMarkerClick,
  refreshTrigger = 0,
  apiBaseUrl,
  maxZoom = 22,
  filters = {},
  onVisiblePhotosChange // New prop to notify parent of visible photos
}) {
  const [baseLayer, setBaseLayer] = useState('streets');
  const [photoMarkers, setPhotoMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch photo markers from API
  const fetchPhotoMarkers = async () => {
    try {
      setLoading(true);

      // Build query parameters for filtering
      const params = new URLSearchParams();

      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }
      if (filters.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      const url = `${apiBaseUrl}/photos/markers${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch photo markers: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API response to map format
      const markers = data.markers.map(photo => ({
        id: photo._id,
        lat: photo.location?.lat,
        lon: photo.location?.lon,
        name: photo.filename,
        photo: photo // Keep full photo data for reference
      })).filter(marker =>
        // Only include photos with valid GPS coordinates
        marker.lat != null && marker.lon != null &&
        Number.isFinite(marker.lat) && Number.isFinite(marker.lon)
      );

      setPhotoMarkers(markers);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching photo markers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch markers on mount and when refresh trigger or filters change
  useEffect(() => {
    if (apiBaseUrl) {
      fetchPhotoMarkers();
    }
  }, [apiBaseUrl, refreshTrigger, filters.startDate, filters.endDate, filters.tags]);

  // Handle marker clicks
  const handleMarkerClick = (markerId, marker) => {
    if (onMarkerClick && marker.photo) {
      onMarkerClick(marker.photo);
    }
  };

  // Handle bounds change - notify parent of visible photo IDs
  const handleBoundsChange = useCallback((visibleIds) => {
    if (onVisiblePhotosChange) {
      onVisiblePhotosChange(visibleIds);
    }
  }, [onVisiblePhotosChange]);

  // If no API URL provided, show dummy markers for development
  const items = apiBaseUrl ? photoMarkers : [
    { id: "a", lat: 38.0, lon: -87.5, name: "A" },
    { id: "b", lat: 38.02, lon: -87.52, name: "B" }
  ];

  return (
    <HwcMap
      items={items}
      mapTilerKey={mapTilerKey}
      mapboxToken={mapboxToken}
      baseLayer={baseLayer}
      onBaseLayerChange={setBaseLayer}
      selectedIds={selectedPhotoIds}
      onSelect={handleMarkerClick}
      onBoundsChange={handleBoundsChange}
      showControls={true}
      cluster={true}
      clusterOptions={{
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 22
      }}
      maxZoom={maxZoom}
    />
  );
}