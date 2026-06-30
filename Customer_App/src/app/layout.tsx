import type { Metadata } from "next";
// Navbar removed from root layout
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
    title: "Elite World | Premium Bespoke Tailoring",
    description: "Custom garments tailored exclusively for you. Browse designs, order custom fits, and track your delivery.",
    keywords: ["tailoring", "bespoke", "custom suit", "saree blouse", "lehenga", "salem tailoring"],
    authors: [{ name: "Elite World" }],
    openGraph: {
        title: "Elite World | Premium Bespoke Tailoring",
        description: "Custom garments tailored exclusively for you. Browse designs, order custom fits, and track your delivery.",
        url: 'https://elitestitchworld.com',
        siteName: 'Elite World',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Elite World | Premium Bespoke Tailoring',
        description: 'Custom garments tailored exclusively for you. Browse designs, order custom fits, and track your delivery.',
        images: ['/og-image.jpg'],
    },
};

import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
            <body suppressHydrationWarning>
                <ThemeProvider>
                    <LanguageProvider>
                        <CartProvider>
                            {children}
                            <Footer />
                        </CartProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
