'use client';

import Navbar from "@/components/Navbar";

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main style={{ minHeight: '100vh' }}>
                {children}
            </main>
        </>
    );
}
