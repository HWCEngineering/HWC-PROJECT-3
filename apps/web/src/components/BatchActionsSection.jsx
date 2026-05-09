import { useState, useRef, useEffect } from 'react';
import { FiDownload, FiTrash2, FiEdit3 } from 'react-icons/fi';

export function BatchActionsSection({ selectedPhotoIds, onExport }) {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu]);

    return (
        <div className="batch-actions-section">
            <p className="batch-actions-info">
                {selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''} selected
            </p>

            <div className="batch-actions-buttons">
                {/* Export Dropdown */}
                <div className="export-dropdown" ref={exportMenuRef}>
                    <button
                        className="panel-button"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                        <FiDownload />
                        Export
                    </button>
                    {showExportMenu && (
                        <div className="export-menu">
                            <button
                                className="export-menu-item"
                                onClick={() => {
                                    onExport('zip');
                                    setShowExportMenu(false);
                                }}
                            >
                                <FiDownload />
                                ZIP Archive
                            </button>
                            <button
                                className="export-menu-item"
                                onClick={() => {
                                    onExport('kml');
                                    setShowExportMenu(false);
                                }}
                            >
                                <FiDownload />
                                KML (Google Earth)
                            </button>
                            <button
                                className="export-menu-item"
                                onClick={() => {
                                    onExport('kmz');
                                    setShowExportMenu(false);
                                }}
                            >
                                <FiDownload />
                                KMZ (Compressed)
                            </button>
                        </div>
                    )}
                </div>

                {/* Other actions can be added here */}
            </div>

            <p className="batch-actions-hint">
                Select photos from the photo browser to enable more actions
            </p>
        </div>
    );
}
