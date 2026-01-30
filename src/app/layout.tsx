import type { Metadata } from 'next';
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const sourceSerif = Source_Serif_4({
    subsets: ['latin'],
    variable: '--font-source-serif',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});

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
        <html
            lang="en"
            className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} dark`}
        >
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
