'use client';


interface Location {
    lat: number;
    lng: number;
    title: string;
    description?: string;
}

export default function MapComponent({ locations }: { locations: Location[] }) {
    if (!locations || locations.length === 0) {
        return <div style={{ height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Map Unavailable</div>;
    }

    const loc = locations[0];
    // Create an OpenStreetMap embed URL
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.02}%2C${loc.lat - 0.02}%2C${loc.lng + 0.02}%2C${loc.lat + 0.02}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`;

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={mapUrl}
                style={{ border: 0 }}
                title={loc.title}
            />
        </div>
    );
}
