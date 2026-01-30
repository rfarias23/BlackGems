import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'BlackGem',
    description: 'Fund management platform for Search Funds and Micro-PE',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
