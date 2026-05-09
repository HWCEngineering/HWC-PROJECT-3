# @hwc/map Changelog

## [0.1.0] - 2026-03-03

### Added
- Added `onBoundsChange` callback prop to notify parent components when visible items change
- Added `BoundsTracker` component to monitor map viewport and calculate visible items
- Map now tracks which markers are within the current viewport bounds in real-time

### Changed
- Map now emits visible item IDs on pan and zoom events
- Improved integration with photo filtering features

## [0.0.1] - Initial Release

### Added
- Initial map component with Leaflet integration
- Support for multiple base layers (streets, satellite)
- Marker clustering support
- Custom marker icons with selection and highlight states
- Zoom controls and layer toggle
