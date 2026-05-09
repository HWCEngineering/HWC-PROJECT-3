import { useState, useCallback } from 'react';
import { ActionsPanelWrapper } from './ActionsPanelWrapper.jsx';
import { PhotoBrowserWrapper } from './PhotoBrowserWrapper.jsx';
import { MapWrapper } from './MapWrapper.jsx';
import { PhotoLightbox } from '@hwc/photo-panel';

export function PhotoMapApp({ apiBaseUrl, mapTilerKey, mapboxToken, maxZoom = 22 }) {
  // Shared state between map and photo panel
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [highlightedPhotoId, setHighlightedPhotoId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [visiblePhotoIds, setVisiblePhotoIds] = useState(null); // null = show all, array = filter to visible
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    tags: null
  });

  // Panel state - manage both panels together on mobile
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isPhotosOpen, setIsPhotosOpen] = useState(true);

  // Lightbox state - lifted to app level for full-screen overlay
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [allPhotos, setAllPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Toggle both panels on mobile, individual on desktop
  const handleActionsToggle = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !isActionsOpen && !isPhotosOpen) {
      // On mobile, if both closed, open both
      setIsActionsOpen(true);
      setIsPhotosOpen(true);
    } else {
      setIsActionsOpen(!isActionsOpen);
    }
  };

  const handlePhotosToggle = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !isActionsOpen && !isPhotosOpen) {
      // On mobile, if both closed, open both
      setIsActionsOpen(true);
      setIsPhotosOpen(true);
    } else {
      setIsPhotosOpen(!isPhotosOpen);
    }
  };

  // Handle photo uploads - refresh both panel and map
  const handlePhotosChange = () => {
    const newTrigger = Date.now();
    setRefreshTrigger(newTrigger);
  };

  // Handle visible photos change from map
  const handleVisiblePhotosChange = useCallback((visibleIds) => {
    setVisiblePhotoIds(visibleIds);
  }, []);

  // Handle map marker clicks - highlight photo in panel
  const handleMarkerClick = (photo) => {
    setHighlightedPhotoId(photo._id);

    // Auto-open photo panel if closed on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !isPhotosOpen) {
      setIsPhotosOpen(true);
    } else if (!isMobile && !isPhotosOpen) {
      // On desktop, just open the photo panel
      setIsPhotosOpen(true);
    }
  };

  // Handle photo clicks in panel - open lightbox
  const handlePhotoClick = (photo, photos, photoIndex) => {
    setLightboxPhoto(photo);
    setAllPhotos(photos);
    setCurrentPhotoIndex(photoIndex);
    setIsLightboxOpen(true);
  };

  // Lightbox navigation
  const handleLightboxNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < allPhotos.length) {
      setCurrentPhotoIndex(newIndex);
      setLightboxPhoto(allPhotos[newIndex]);
    }
  };

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxPhoto(null);
    setCurrentPhotoIndex(0);
  };

  // Handle lightbox edit
  const handleLightboxEdit = (updatedPhoto) => {
    // Update photo in allPhotos array
    setAllPhotos(prev => prev.map(p =>
      p._id === updatedPhoto._id ? updatedPhoto : p
    ));
    // Trigger refresh
    handlePhotosChange();
  };

  // Handle lightbox delete
  const handleLightboxDelete = (deletedPhoto) => {
    // Remove photo from allPhotos array
    const newPhotos = allPhotos.filter(p => p._id !== deletedPhoto._id);
    setAllPhotos(newPhotos);

    // Remove from selection if selected
    if (selectedPhotoIds.includes(deletedPhoto._id)) {
      setSelectedPhotoIds(selectedPhotoIds.filter(id => id !== deletedPhoto._id));
    }

    // Handle navigation after delete
    if (newPhotos.length === 0) {
      closeLightbox();
    } else if (currentPhotoIndex >= newPhotos.length) {
      const newIndex = newPhotos.length - 1;
      setCurrentPhotoIndex(newIndex);
      setLightboxPhoto(newPhotos[newIndex]);
    } else {
      setLightboxPhoto(newPhotos[currentPhotoIndex]);
    }

    // Trigger refresh
    handlePhotosChange();
  };

  // Handle export from actions panel
  const handleExport = async (format) => {
    if (selectedPhotoIds.length === 0) return;

    const exportUrl = `${apiBaseUrl}/export/${format}?${selectedPhotoIds.map(id => `payload=${id}`).join('&')}`;

    try {
      const response = await fetch(exportUrl);
      const blob = await response.blob();

      // Get filename from Content-Disposition header or generate with timestamp
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `photos_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <>
      {/* Left Panel - Actions */}
      <ActionsPanelWrapper
        apiBaseUrl={apiBaseUrl}
        selectedPhotoIds={selectedPhotoIds}
        onPhotosChange={handlePhotosChange}
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        isOpen={isActionsOpen}
        onToggle={handleActionsToggle}
      />

      {/* Right Panel - Photo Browser */}
      <PhotoBrowserWrapper
        apiBaseUrl={apiBaseUrl}
        selectedPhotoIds={selectedPhotoIds}
        onSelectionChange={setSelectedPhotoIds}
        highlightedPhotoId={highlightedPhotoId}
        onPhotoClick={handlePhotoClick}
        onPhotosChange={handlePhotosChange}
        refreshTrigger={refreshTrigger}
        filters={filters}
        visiblePhotoIds={visiblePhotoIds}
        isOpen={isPhotosOpen}
        onToggle={handlePhotosToggle}
      />

      {/* Map */}
      <div style={{ height: '93vh' }}>
        <MapWrapper
          mapTilerKey={mapTilerKey}
          mapboxToken={mapboxToken}
          selectedPhotoIds={selectedPhotoIds}
          onMarkerClick={handleMarkerClick}
          onVisiblePhotosChange={handleVisiblePhotosChange}
          refreshTrigger={refreshTrigger}
          apiBaseUrl={apiBaseUrl}
          maxZoom={maxZoom}
          filters={filters}
        />
      </div>

      {/* Full-Screen Photo Lightbox Overlay */}
      <PhotoLightbox
        photo={lightboxPhoto}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onDelete={handleLightboxDelete}
        onEdit={handleLightboxEdit}
        apiBaseUrl={apiBaseUrl}
        photos={allPhotos}
        currentIndex={currentPhotoIndex}
        onNavigate={handleLightboxNavigate}
      />
    </>
  );
}