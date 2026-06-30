'use client';

import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div style={{ height: '500px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

interface DeliveryLocation {
    lat: number;
    lng: number;
    title: string;
    description: string;
}

export default function LiveMapPage() {
    const [locations, setLocations] = useState<DeliveryLocation[]>([]);

    useEffect(() => {
        fetchLocations();

        // Poll for real-time updates every 10 seconds
        const interval = setInterval(() => {
            fetchLocations();
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await fetch('$\{process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"\}/api/orders');
            const result = await response.json();
            if (result.success && result.orders) {
                const mappedLocations = result.orders.map((order: any) => {
                    // Filter for active delivery orders
                    const isDeliveryActive = ['assigned', 'picked_up', 'out_for_delivery'].includes(order.delivery_status || order.status);
                    if (!isDeliveryActive) return null;

                    // Use order delivery location or fallback to mock coordinates around Salem, India
                    let lat = order.delivery_location?.lat;
                    let lng = order.delivery_location?.lng;

                    if (!lat || !lng) {
                        // Deterministic but shifted mock coords based on Order ID
                        const hash = order.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                        lat = 11.6643 + ((hash % 100) / 1000) - 0.05;
                        lng = 78.1460 + (((hash * 13) % 100) / 1000) - 0.05;
                    }

                    return {
                        lat: Number(lat),
                        lng: Number(lng),
                        title: `Order #${order.id.slice(0, 8)}`,
                        description: `
                            Status: ${order.delivery_status || 'assigned'}
                            Customer: ${order.customer_name}
                            Amount: ₹${order.amount || 0}
                        `
                    };
                }).filter(Boolean) as DeliveryLocation[];

                setLocations(mappedLocations);
            }
        } catch (error) {
            console.error('Error fetching live tracker locations:', error);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Live Delivery Tracking</h1>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <MapComponent locations={locations} />
            </div>
        </div>
    );
}
