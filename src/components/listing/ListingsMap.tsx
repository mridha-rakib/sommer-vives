import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { formatDKK } from '@/lib/pricing';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapListing {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  region: string | null;
  hero_image: string | null;
  base_price_per_night: number;
  latitude: number | null;
  longitude: number | null;
}

function makeImageIcon(url: string, fallbackLabel: string) {
  const safeUrl = url.replace(/"/g, '&quot;');
  return L.divIcon({
    className: 'sv-listing-marker',
    html: `
      <div class="sv-pin">
        <div class="sv-pin-img" style="background-image:url('${safeUrl}')">${url ? '' : `<span>${fallbackLabel}</span>`}</div>
        <div class="sv-pin-arrow"></div>
      </div>
    `,
    iconSize: [60, 78],
    iconAnchor: [30, 78],
    popupAnchor: [0, -72],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
  }, [points, map]);
  return null;
}

export function ListingsMap({ listings }: { listings: MapListing[] }) {
  const withCoords = listings.filter(
    (l): l is MapListing & { latitude: number; longitude: number } =>
      l.latitude != null && l.longitude != null,
  );

  const points: [number, number][] = withCoords.map((l) => [l.latitude, l.longitude]);
  const fallbackCenter: [number, number] = points[0] || [56.0, 10.5];

  return (
    <>
      <style>{`
        .sv-listing-marker { background: transparent !important; border: none !important; }
        .sv-pin {
          position: relative;
          width: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35));
          transition: transform .15s ease;
        }
        .sv-pin:hover { transform: translateY(-4px) scale(1.05); }
        .sv-pin-img {
          width: 60px; height: 60px;
          border-radius: 50%;
          border: 3px solid hsl(var(--primary));
          background-color: hsl(var(--card));
          background-size: cover;
          background-position: center;
          display: flex; align-items: center; justify-content: center;
          color: hsl(var(--primary));
          font-weight: 600; font-size: 11px;
        }
        .sv-pin-arrow {
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid hsl(var(--primary));
          margin-top: -2px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
        }
        .leaflet-popup-tip { background: hsl(var(--card)); }
        .leaflet-popup-content { margin: 0; width: 240px !important; }
      `}</style>

      <div className="h-[560px] w-full overflow-hidden rounded-2xl border border-border/40 shadow-sm">
        <MapContainer
          center={fallbackCenter}
          zoom={6}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {withCoords.map((l) => (
            <Marker
              key={l.id}
              position={[l.latitude, l.longitude]}
              icon={makeImageIcon(l.hero_image || '', l.name.slice(0, 2))}
            >
              <Popup>
                <Link to={`/listing/${l.slug}`} className="block group">
                  {l.hero_image && (
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${l.hero_image})` }}
                    />
                  )}
                  <div className="p-3 space-y-1">
                    <div className="font-display text-sm font-semibold text-foreground group-hover:text-primary line-clamp-1">
                      {l.name}
                    </div>
                    {(l.address || l.region) && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {[l.address, l.region].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="pt-1.5 text-sm font-semibold text-primary">
                      {formatDKK(l.base_price_per_night)} / night
                    </div>
                  </div>
                </Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {withCoords.length === 0 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          No homes have a map location yet. Owners can add a location when editing their home.
        </p>
      )}
    </>
  );
}
