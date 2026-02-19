import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import { CookieConsent } from '@/components/landing/cookie-consent';

export const metadata: Metadata = {
    metadataBase: new URL('https://www.blackgem.ai'),
    title: {
        default: 'BlackGem — AI Operating Partner for Private Equity',
        template: '%s | BlackGem',
    },
    description:
        'BlackGem runs your fund operations so you can focus on deals. AI-powered deal pipeline, LP management, capital operations, and investor portal for emerging fund managers.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'BlackGem',
        title: 'BlackGem — AI Operating Partner for Private Equity',
        description:
            'AI-powered fund management for emerging PE managers and search funds. Deal pipeline, LP portal, capital operations, quarterly reports.',
        images: [
            {
                url: '/images/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'BlackGem — AI Operating Partner for Private Equity',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'BlackGem — AI Operating Partner for Private Equity',
        description:
            'AI-powered fund management for emerging PE managers and search funds.',
        images: ['/images/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
    },
    verification: {
        google: '3OuAKRQ_MgNGh_mUohbW1Xve7V_Sl8vfukAdT7aKAO4',
    },
    alternates: {
        canonical: '/',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="font-sans antialiased">
                {children}
                <CookieConsent />
            </body>
        </html>
    );
}
