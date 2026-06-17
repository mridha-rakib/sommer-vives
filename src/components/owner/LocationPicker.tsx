import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

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
  const [query, setQuery] = useState(address || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hasPoint = latitude != null && longitude != null;
  const center = useMemo<[number, number]>(
    () => (hasPoint ? [latitude as number, longitude as number] : DENMARK),
    [hasPoint, latitude, longitude],
  );

  // Sync external address prop into the search field when user hasn't typed yet
  useEffect(() => {
    if (!query && address) setQuery(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced autocomplete via Nominatim
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { Accept: 'application/json' } },
        );
        const data = (await res.json()) as Suggestion[];
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pick = (s: Suggestion) => {
    onChange(parseFloat(s.lat), parseFloat(s.lon));
    setQuery(s.display_name);
    setOpen(false);
    setSuggestions([]);
  };

  const submitSearch = async () => {
    const q = query.trim();
    if (!q) return;
    if (suggestions[0]) {
      pick(suggestions[0]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        pick(data[0]);
      } else {
        toast.error('Address not found — try a different search or click the map');
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" /> Location on map
        </h3>
        <p className="text-xs text-muted-foreground">
          Search your address, pick a suggestion, or click on the map to set the pin.
        </p>
      </div>

      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitSearch();
              }
            }}
            placeholder="Search address, city, postal code…"
            className="pl-9 pr-9"
          />
        </div>
        {open && suggestions.length > 0 && (
          <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg">
            {suggestions.map((s, i) => (
              <li key={`${s.lat}-${s.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => pick(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2">{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
              <Recenter center={center} zoom={13} />
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

      {hasPoint && (
        <p className="text-xs text-muted-foreground">
          Pin set at {(latitude as number).toFixed(5)}, {(longitude as number).toFixed(5)}. Drag the marker to fine-tune.
        </p>
      )}
    </div>
  );
}
