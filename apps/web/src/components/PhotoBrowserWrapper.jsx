import { useState } from 'react';
import { HwcPanel, PanelSection } from '@hwc/panel';
import { FiImage } from 'react-icons/fi';
import { PhotoGrid } from '@hwc/photo-panel';

export function PhotoBrowserWrapper({
    apiBaseUrl,
    selectedPhotoIds = [],
    onSelectionChange,
    highlightedPhotoId,
    onPhotoClick,
    refreshTrigger = 0,
    onPhotosChange,
    filters = {},
    visiblePhotoIds = null, // null = show all, array = filter to visible
    isOpen,
    onToggle
}) {

    return (
        <HwcPanel
            isOpen={isOpen}
            onToggle={onToggle}
            title="Photo Browser"
            position="right"
            toggleLabel="Open Photo Browser"
            hideToggleOnMobile={true} // Hide on mobile, left panel toggle will open both
        >
            {/* Photos Section - Always expanded, no accordion */}
            <PanelSection
                title={`Photos`}
                icon={<FiImage />}
                isExpanded={true}
                onToggle={() => { }} // No toggle, always open
            >
                <PhotoGrid
                    apiBaseUrl={apiBaseUrl}
                    selectedPhotoIds={selectedPhotoIds}
                    onSelectionChange={onSelectionChange}
                    highlightedPhotoId={highlightedPhotoId}
                    onPhotoClick={onPhotoClick}
                    refreshTrigger={refreshTrigger}
                    onPhotosChange={onPhotosChange}
                    filters={filters}
                    visiblePhotoIds={visiblePhotoIds}
                    hideActions={true} // Hide batch actions since they're in left panel
                    hideLightbox={true} // Don't render lightbox in grid, it's at app level
                />
            </PanelSection>
        </HwcPanel>
    );
}
