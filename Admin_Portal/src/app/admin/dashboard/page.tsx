'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, Users, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        activeDeliveries: 0,
        totalDrivers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Mock stats
            setTimeout(() => {
                setStats({
                    totalOrders: 15,
                    pendingOrders: 5,
                    activeDeliveries: 3,
                    totalDrivers: 8
                });
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--foreground)' }}>Dashboard Overview</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem'
            }}>
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={<Package size={24} />}
                    color="var(--primary)"
                />
                <StatCard
                    title="Pending Delivery"
                    value={stats.pendingOrders}
                    icon={<AlertCircle size={24} />}
                    color="#eab308" // Yellow
                />
                <StatCard
                    title="Active Deliveries"
                    value={stats.activeDeliveries}
                    icon={<Truck size={24} />}
                    color="#3b82f6" // Blue
                />
                <StatCard
                    title="Total Drivers"
                    value={stats.totalDrivers}
                    icon={<Users size={24} />}
                    color="#10b981" // Green
                />
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--foreground)' }}>Recent Activity</h2>
                <p style={{ color: 'var(--text-muted)' }}>Real-time activity feed coming soon...</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <div style={{
            backgroundColor: 'var(--secondary)',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: `${color}20`, // 20% opacity
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color
            }}>
                {icon}
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{value}</h3>
            </div>
        </div>
    );
}
