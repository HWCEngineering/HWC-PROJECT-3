// Data credits as published in each Esri service's copyrightText.
const ESRI_STREETS_CREDITS =
  'Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, ' +
  'Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, © OpenStreetMap contributors, ' +
  'and the GIS User Community';
const ESRI_HYBRID_CREDITS =
  'Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community | ' +
  'Labels: Esri, HERE, Garmin, © OpenStreetMap contributors';

export function MapAttribution({ baseLayer = 'streets' }) {
  const getAttribution = () => {
    switch (baseLayer) {
      case 'satellite':
        return {
          text: ESRI_HYBRID_CREDITS,
          url: 'https://www.esri.com/en-us/legal/terms/data-attributions',
          poweredByEsri: true
        };
      case 'satellite-mapbox':
        return {
          text: '© Mapbox © Maxar',
          url: 'https://www.mapbox.com/'
        };
      case 'satellite-google':
        return {
          text: '© Google',
          url: 'https://www.google.com/permissions/geoguidelines/'
        };
      case 'streets':
      default:
        return {
          text: ESRI_STREETS_CREDITS,
          url: 'https://www.esri.com/en-us/legal/terms/data-attributions',
          poweredByEsri: true
        };
    }
  };

  const attribution = getAttribution();

  return (
    <div className="hwc-map-attribution">
      <a href="https://www.hwcengineering.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
        <b>© {new Date().getFullYear()} HWC Engineering</b>
      </a>
      {' | '}
      {attribution.poweredByEsri && (
        <>
          <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            Powered by Esri
          </a>
          {' | '}
        </>
      )}
      <a
        href={attribution.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit' }}
      >
        {attribution.text}
      </a>
    </div>
  );
}
