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

        // Subscribe to real-time updates on orders table
        // const subscription = supabase
        //     .channel('orders_tracking')
        //     .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        //         console.log('Real-time update:', payload);
        //         // Refresh locations when an order is updated (e.g., location change)
        //         fetchLocations();
        //     })
        //     .subscribe();

        return () => {
            // subscription.unsubscribe();
        };
    }, []);

    const fetchLocations = async () => {
        // Fetch orders that are out for delivery or assigned
        // const { data: orders } = await supabase
        //     .from('orders')
        //     .select(`
        //         id, 
        //         customer_name, 
        //         delivery_status, 
        //         delivery_location,
        //         delivery_personnel:assigned_to (name, personnel_number)
        //     `)
        //     .in('delivery_status', ['out_for_delivery', 'assigned'])
        //     .not('delivery_location', 'is', null);
        const orders: any = [];

        if (orders) {
            const mappedLocations = orders.map((order: any) => {
                const loc = order.delivery_location;
                if (!loc || !loc.lat || !loc.lng) return null;

                return {
                    lat: loc.lat,
                    lng: loc.lng,
                    title: `Order #${order.id.slice(0, 8)}`,
                    description: `
                        Status: ${order.delivery_status}
                        Driver: ${order.delivery_personnel?.name || 'Unknown'}
                        Customer: ${order.customer_name}
                    `
                };
            }).filter(Boolean) as DeliveryLocation[];

            setLocations(mappedLocations);
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
