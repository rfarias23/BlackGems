import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';

export const metadata: Metadata = {
    title: 'BlackGem — Institutional excellence from day one.',
    description: 'Private equity infrastructure for the next generation of fund managers. Deal pipeline, LP management, capital operations, and investor portal — all in one platform.',
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
