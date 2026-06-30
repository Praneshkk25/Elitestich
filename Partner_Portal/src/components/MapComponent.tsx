'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
    lat: number;
    lng: number;
    title: string;
    description?: string;
}

export default function MapComponent({ locations }: { locations: Location[] }) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Configure default icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Initialize map if it doesn't exist
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([11.6643, 78.1460], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);
        }

        const map = mapRef.current;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        if (locations && locations.length > 0) {
            const bounds: L.LatLngBoundsExpression = [];

            locations.forEach((loc) => {
                const isCustomer = loc.title.toLowerCase().includes('customer') || loc.title.toLowerCase().includes('your');
                
                // Customize marker pin styling
                const customIcon = L.divIcon({
                    html: `<div style="
                        background-color: ${isCustomer ? '#ef4444' : '#eab308'};
                        color: black;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px solid #fff;
                        font-weight: bold;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                        font-size: 16px;
                    ">${isCustomer ? '👤' : '🚚'}</div>`,
                    className: 'custom-div-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker([loc.lat, loc.lng], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(`<strong>${loc.title}</strong><br/>${loc.description || ''}`);
                
                markersRef.current.push(marker);
                bounds.push([loc.lat, loc.lng]);
            });

            // Auto fit map bounds to show all markers
            if (bounds.length > 1) {
                map.fitBounds(bounds, { padding: [50, 50] });
            } else if (bounds.length === 1) {
                map.setView(bounds[0] as L.LatLngExpression, 14);
            }
        }

        return () => {
            // cleanup is handled on component unmount
        };
    }, [locations]);

    // Handle map destruction on unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div 
            ref={mapContainerRef} 
            style={{ 
                height: '100%', 
                width: '100%', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                border: '1px solid var(--border)' 
            }} 
        />
    );
}
