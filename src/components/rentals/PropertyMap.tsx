import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Property {
  id: string;
  title: string;
  price: number;
  coordinates: { lat: number; lng: number };
}

interface PropertyMapProps {
  properties: Property[];
  hoveredProperty: string | null;
  onPropertyHover: (id: string | null) => void;
}

export function PropertyMap({ properties, hoveredProperty, onPropertyHover }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Denmark
    const map = L.map(mapRef.current, {
      center: [55.7, 8.4],
      zoom: 10,
      scrollWheelZoom: true,
    });

    // Use CartoDB Positron for a clean, modern look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    properties.forEach(property => {
      const isHovered = property.id === hoveredProperty;
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${isHovered ? 'hsl(42, 58%, 54%)' : 'hsl(156, 59%, 11%)'};
            color: ${isHovered ? 'hsl(156, 59%, 11%)' : 'hsl(42, 58%, 54%)'};
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
            transition: all 0.2s ease;
            white-space: nowrap;
          ">
            ${property.price.toLocaleString('da-DK')} kr.
          </div>
        `,
        iconSize: [80, 36],
        iconAnchor: [40, 36],
      });

      const marker = L.marker([property.coordinates.lat, property.coordinates.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .on('mouseover', () => onPropertyHover(property.id))
        .on('mouseout', () => onPropertyHover(null));

      marker.bindPopup(`
        <div style="min-width: 150px;">
          <strong>${property.title}</strong><br/>
          <span style="color: hsl(42, 58%, 54%); font-weight: 600;">
            ${property.price.toLocaleString('da-DK')} kr. / nat
          </span>
        </div>
      `);

      markersRef.current.set(property.id, marker);
    });

    // Fit bounds to show all markers
    if (properties.length > 0) {
      const bounds = L.latLngBounds(
        properties.map(p => [p.coordinates.lat, p.coordinates.lng] as [number, number])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [properties, hoveredProperty, onPropertyHover]);

  return <div ref={mapRef} className="w-full h-full" />;
}
