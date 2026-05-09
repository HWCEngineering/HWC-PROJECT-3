# HWC Photo Log - Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Zoom and pan functionality in photo lightbox viewer
- Mouse wheel zoom, pinch-to-zoom on mobile, and zoom control buttons
- Click and drag to pan around zoomed images
- Reset zoom button and double-click to reset
- Map viewport-based photo filtering - photos in the panel now automatically filter to show only those with markers visible on the map
- Real-time photo list updates as you pan and zoom the map
- Visual indicators showing filtered photo counts ("X of Y in view")
- Helpful empty state messages when no photos are visible in current map view

### Changed
- Photo panel now displays photos corresponding to visible map markers, eliminating random ordering
- Improved user experience with synchronized map and photo list views
- Enhanced lightbox with full image viewing capabilities
- Updated @hwc/map to v0.1.0 with bounds tracking support
- Updated @hwc/photo-panel to v0.2.0 with zoom/pan and viewport filtering support

### Technical
- Added `react-zoom-pan-pinch` library for smooth zoom and pan interactions
- Added `BoundsTracker` component to map for real-time viewport monitoring
- Implemented client-side photo filtering based on map bounds
- Enhanced state management for visible photo IDs across components

## [0.0.1] - Initial Release

### Added
- Photo logging system for construction progress tracking
- Interactive map with photo markers using Leaflet
- Photo upload and management
- Photo browser with grid view and lightbox
- Batch operations (select, export, delete)
- Export functionality (ZIP, KML, KMZ)
- Date and tag filtering
- Marker clustering for better map performance
- Multiple base layer options (streets, satellite)
