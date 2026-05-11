/**
 * GoogleMapView — reusable Google Maps wrapper
 * Falls back to an SVG placeholder when VITE_GOOGLE_MAPS_API_KEY is not set.
 *
 * Props:
 *   center      { lat, lng }                required
 *   zoom        number                      default 14
 *   mapTypeId   'roadmap'|'satellite'|'hybrid'|'terrain'  default 'hybrid'
 *   markers     [{ lat, lng, title, color, label, info }]  optional
 *   polygon     [{ lat, lng }]              optional  — draws a boundary polygon
 *   height      string                      default '400px'
 *   className   string                      optional
 *   onMarkerClick (marker) => void          optional
 */

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Polygon, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const HAS_KEY = API_KEY && API_KEY !== 'your_google_maps_api_key_here';

const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const DEFAULT_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: MAP_STYLES,
};

// ── Fallback SVG map ───────────────────────────────────────────────────────────
function FallbackMap({ center, markers, polygon, height }) {
  const W = 600, H = 380;
  const pad = 40;

  const allPts = [
    ...(polygon || []),
    ...(markers || []).map(m => ({ lat: m.lat, lng: m.lng })),
    center,
  ].filter(Boolean);

  const lats = allPts.map(p => p.lat);
  const lngs = allPts.map(p => p.lng);
  const minLat = Math.min(...lats) - 0.005, maxLat = Math.max(...lats) + 0.005;
  const minLng = Math.min(...lngs) - 0.005, maxLng = Math.max(...lngs) + 0.005;

  const toX = lng => pad + ((lng - minLng) / (maxLng - minLng || 0.01)) * (W - pad * 2);
  const toY = lat => pad + (1 - (lat - minLat) / (maxLat - minLat || 0.01)) * (H - pad * 2);

  const polyPts = polygon?.map(p => `${toX(p.lng)},${toY(p.lat)}`).join(' ') || '';

  return (
    <div className="relative w-full bg-green-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex flex-col" style={{ height }}>
      <div className="absolute top-2 right-2 z-10 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 text-xs text-amber-700 font-medium">
        Set VITE_GOOGLE_MAPS_API_KEY for live maps
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(t => (
          <g key={t}>
            <line x1={pad} y1={pad + t*(H-pad*2)} x2={W-pad} y2={pad + t*(H-pad*2)} stroke="#d1fae5" strokeWidth="1" />
            <line x1={pad + t*(W-pad*2)} y1={pad} x2={pad + t*(W-pad*2)} y2={H-pad} stroke="#d1fae5" strokeWidth="1" />
          </g>
        ))}
        {/* Polygon */}
        {polyPts && (
          <polygon points={polyPts} fill="#bbf7d0" fillOpacity="0.5" stroke="#16a34a" strokeWidth="2" strokeDasharray="6 3" />
        )}
        {/* Center marker */}
        <circle cx={toX(center.lng)} cy={toY(center.lat)} r="8" fill="#1d4ed8" />
        <circle cx={toX(center.lng)} cy={toY(center.lat)} r="16" fill="#1d4ed8" fillOpacity="0.15" />
        {/* Other markers */}
        {markers?.map((m, i) => (
          <g key={i}>
            <circle cx={toX(m.lng)} cy={toY(m.lat)} r="7" fill={m.color || '#16a34a'} />
            {m.label && (
              <text x={toX(m.lng)} y={toY(m.lat) - 12} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="600">{m.label}</text>
            )}
          </g>
        ))}
        {/* Compass */}
        <text x={W - 20} y={28} fontSize="13" fill="#6b7280">N↑</text>
        {/* Scale label */}
        <text x={pad} y={H - 10} fontSize="9" fill="#9ca3af">
          {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </text>
      </svg>
    </div>
  );
}

// ── Google Maps implementation ────────────────────────────────────────────────
function RealMap({ center, zoom, mapTypeId, markers, polygon, height, onMarkerClick }) {
  const [selected, setSelected] = useState(null);

  const polygonOptions = {
    fillColor: '#16a34a', fillOpacity: 0.2,
    strokeColor: '#16a34a', strokeOpacity: 0.8, strokeWeight: 2,
    editable: false, draggable: false,
  };

  const containerStyle = { width: '100%', height };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom || 14}
      mapTypeId={mapTypeId || 'hybrid'}
      options={DEFAULT_OPTIONS}
    >
      {polygon && polygon.length > 0 && (
        <Polygon paths={polygon} options={polygonOptions} />
      )}

      {markers?.map((m, i) => (
        <Marker
          key={i}
          position={{ lat: m.lat, lng: m.lng }}
          title={m.title}
          label={m.label ? { text: m.label, color: '#fff', fontSize: '11px', fontWeight: 'bold' } : undefined}
          icon={m.color ? {
            path: window.google?.maps?.SymbolPath?.CIRCLE,
            fillColor: m.color,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
            scale: 10,
          } : undefined}
          onClick={() => {
            setSelected(m);
            onMarkerClick?.(m);
          }}
        />
      ))}

      {selected && selected.info && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="p-2 min-w-32">
            <p className="font-semibold text-gray-900 text-sm">{selected.title}</p>
            {selected.info && <p className="text-xs text-gray-500 mt-1">{selected.info}</p>}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
let scriptLoaded = false;

export default function GoogleMapView({
  center,
  zoom = 14,
  mapTypeId = 'hybrid',
  markers = [],
  polygon = [],
  height = '400px',
  className = '',
  onMarkerClick,
}) {
  if (!center || center.lat == null || center.lng == null) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl ${className}`} style={{ height }}>
        <div className="text-center text-gray-400">
          <Navigation size={28} className="mx-auto mb-2" />
          <p className="text-sm">No GPS coordinates set</p>
        </div>
      </div>
    );
  }

  if (!HAS_KEY) {
    return <FallbackMap center={center} markers={markers} polygon={polygon} height={height} />;
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ height }}>
      <LoadScript googleMapsApiKey={API_KEY} loadingElement={
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      }>
        <RealMap
          center={center}
          zoom={zoom}
          mapTypeId={mapTypeId}
          markers={markers}
          polygon={polygon}
          height={height}
          onMarkerClick={onMarkerClick}
        />
      </LoadScript>
    </div>
  );
}
