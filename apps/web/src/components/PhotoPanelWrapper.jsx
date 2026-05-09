import { useState } from 'react';
import { PhotoPanel } from '@hwc/photo-panel';

export function PhotoPanelWrapper({
  apiBaseUrl,
  selectedPhotoIds = [],
  onSelectionChange,
  highlightedPhotoId,
  onPhotoClick,
  onPhotosChange,
  refreshTrigger = 0,
  filters = {},
  onFiltersChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PhotoPanel
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      apiBaseUrl={apiBaseUrl}
      title="Photo Manager"
      selectedPhotoIds={selectedPhotoIds}
      onSelectionChange={onSelectionChange}
      highlightedPhotoId={highlightedPhotoId}
      onPhotoClick={onPhotoClick}
      onPhotosChange={onPhotosChange}
      refreshTrigger={refreshTrigger}
      filters={filters}
      onFiltersChange={onFiltersChange}
    />
  );
}