import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Fix default marker icons in Vite bundles
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

const DENMARK: [number, number] = [56.0, 10.5];

function ClickToSet({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  onChange: (lat: number | null, lng: number | null) => void;
}

export function LocationPicker({ latitude, longitude, address, onChange }: Props) {
  const [searching, setSearching] = useState(false);
  const hasPoint = latitude != null && longitude != null;
  const center = useMemo<[number, number]>(
    () => (hasPoint ? [latitude as number, longitude as number] : DENMARK),
    [hasPoint, latitude, longitude],
  );

  const geocode = async () => {
    const q = (address || '').trim();
    if (!q) {
      toast.error('Add an address first or click on the map');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        onChange(parseFloat(data[0].lat), parseFloat(data[0].lon));
        toast.success('Location found from address');
      } else {
        toast.error('Address not found — click the map to set the pin manually');
      }
    } catch {
      toast.error('Could not look up address');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" /> Location on map
          </h3>
          <p className="text-xs text-muted-foreground">
            Click anywhere on the map, drag the pin, or look up the address.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={geocode} disabled={searching} className="gap-1.5">
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Find from address
        </Button>
      </div>

      <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
        <MapContainer center={center} zoom={hasPoint ? 13 : 6} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSet onPick={(lat, lng) => onChange(lat, lng)} />
          {hasPoint && (
            <>
              <Recenter center={center} />
              <Marker
                position={center}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = (e.target as L.Marker).getLatLng();
                    onChange(lat, lng);
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="latitude" className="text-xs">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            value={latitude ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : parseFloat(e.target.value);
              onChange(Number.isFinite(v as number) ? (v as number) : null, longitude);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude" className="text-xs">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            value={longitude ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : parseFloat(e.target.value);
              onChange(latitude, Number.isFinite(v as number) ? (v as number) : null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
