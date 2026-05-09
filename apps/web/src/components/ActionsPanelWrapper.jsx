import { useState } from 'react';
import { HwcPanel, PanelSection } from '@hwc/panel';
import { FiUpload, FiFilter, FiDownload } from 'react-icons/fi';
import { UploadSection, FilterSection } from '@hwc/photo-panel';
import { BatchActionsSection } from './BatchActionsSection.jsx';

export function ActionsPanelWrapper({
    apiBaseUrl,
    selectedPhotoIds = [],
    onPhotosChange,
    filters,
    onFiltersChange,
    onExport,
    isOpen,
    onToggle
}) {

    const [expandedSections, setExpandedSections] = useState({
        upload: false,
        filters: true,
        actions: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleUploadComplete = (count) => {
        if (onPhotosChange) {
            onPhotosChange();
        }
    };

    return (
        <HwcPanel
            isOpen={isOpen}
            onToggle={onToggle}
            title="Tools"
            position="left"
            toggleLabel="Open Tools"
        >
            {/* Upload Section */}
            <PanelSection
                title="Upload Photos"
                icon={<FiUpload />}
                isExpanded={expandedSections.upload}
                onToggle={() => toggleSection('upload')}
            >
                <UploadSection
                    apiBaseUrl={apiBaseUrl}
                    onUploadComplete={handleUploadComplete}
                />
            </PanelSection>

            {/* Filters Section */}
            <PanelSection
                title="Filters"
                icon={<FiFilter />}
                isExpanded={expandedSections.filters}
                onToggle={() => toggleSection('filters')}
            >
                <FilterSection
                    apiBaseUrl={apiBaseUrl}
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                />
            </PanelSection>

            {/* Batch Actions Section */}
            {selectedPhotoIds.length > 0 && (
                <PanelSection
                    title={`Actions (${selectedPhotoIds.length} selected)`}
                    icon={<FiDownload />}
                    isExpanded={expandedSections.actions}
                    onToggle={() => toggleSection('actions')}
                >
                    <BatchActionsSection
                        selectedPhotoIds={selectedPhotoIds}
                        onExport={onExport}
                    />
                </PanelSection>
            )}
        </HwcPanel>
    );
}
