import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { NAIROBI_CENTER } from '../data/nairobi';

const pinIcon = (color, label) => L.divIcon({ className: '', html: `<div class="pin" style="background:${color}"><span>${label}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 30] });
export const truckIcon = L.divIcon({ className: 'truck-marker', html: '🚚', iconSize: [32, 32], iconAnchor: [16, 16] });

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick?.({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }) });
  return null;
}

function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function FitTo({ points }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * Leaflet + OpenStreetMap implementation of the map module.
 * Props are provider-agnostic so it can be swapped for Google Maps later.
 */
export default function MapView({ pickup, dropoff, movers = [], truck, route, onMapClick, tall, zoom = 12, children }) {
  const fit = [pickup, dropoff].filter(Boolean);
  return (
    <div className={`map-wrap ${tall ? 'tall' : ''}`} data-lenis-prevent>
      {children}
      <MapContainer center={NAIROBI_CENTER} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AutoResize />
        <ClickHandler onClick={onMapClick} />
        <FitTo points={fit} />
        {movers.map((m) => (
          <Circle key={m.id} center={[m.coverage.lat, m.coverage.lng]} radius={m.coverage.radiusKm * 1000}
            pathOptions={{ color: m.color, weight: 1.5, fillOpacity: 0.08 }}>
            <Tooltip>{m.name} · {m.coverage.radiusKm} km zone</Tooltip>
          </Circle>
        ))}
        {route && <Polyline positions={route.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#1652f0', weight: 4, dashArray: '8 10' }} />}
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pinIcon('#0e9f6e', 'A')}><Tooltip>Pickup: {pickup.label || 'Pinned'}</Tooltip></Marker>}
        {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={pinIcon('#1652f0', 'B')}><Tooltip>Drop-off: {dropoff.label || 'Pinned'}</Tooltip></Marker>}
        {truck && <Marker position={[truck.lat, truck.lng]} icon={truckIcon} />}
      </MapContainer>
    </div>
  );
}
