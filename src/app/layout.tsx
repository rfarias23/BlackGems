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
    title: 'BlackGem — AI Operating Partner for Private Equity',
    description: 'BlackGem runs your fund operations so you can focus on deals. AI-powered deal pipeline, LP management, capital operations, and investor portal for emerging fund managers.',
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
