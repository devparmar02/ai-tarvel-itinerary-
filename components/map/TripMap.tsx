'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Waypoint } from '@/types';

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const normalIcon = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [20, 32],
  iconAnchor:    [10, 32],
  popupAnchor:   [0, -30],
});

const gemIcon = new L.DivIcon({
  html: '<div style="background:#E07B39;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
  className: '',
  iconSize:   [28, 28],
  iconAnchor: [14, 28],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  // Stringify positions so the effect re-runs whenever any coordinate changes,
  // not only when the count changes (e.g. different waypoints, same count).
  const posKey = JSON.stringify(positions);
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey]);
  return null;
}

interface TripMapProps {
  waypoints: Waypoint[];
}

export default function TripMap({ waypoints }: TripMapProps) {
  const validWaypoints = waypoints.filter(w => w.lat !== 0 && w.lng !== 0);
  const positions: [number, number][] = validWaypoints.map(w => [w.lat, w.lng]);

  const center: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p[0], 0) / positions.length,
       positions.reduce((s, p) => s + p[1], 0) / positions.length]
    : [20.5937, 78.9629]; // centre of India

  return (
    <div className="rounded-card overflow-hidden border border-sand" style={{ height: '300px' }}>
      <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={false}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {/* Route line */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: '#2D6A4F', weight: 3, opacity: 0.8, dashArray: '6,4' }}
          />
        )}

        {/* Waypoint markers */}
        {validWaypoints.map((wp, i) => (
          <Marker
            key={i}
            position={[wp.lat, wp.lng]}
            icon={wp.is_gem ? gemIcon : normalIcon}
          >
            <Popup>
              <div className="text-sm font-semibold">{wp.name}</div>
              <div className="text-xs text-gray-500">Day {wp.day}{wp.is_gem ? ' · 💎 Hidden Gem' : ''}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
