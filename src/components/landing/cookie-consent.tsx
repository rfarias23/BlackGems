'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = document.cookie
            .split('; ')
            .find((row) => row.startsWith('blackgem_consent='));
        if (!consent) {
            const timer = setTimeout(() => setVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const setCookie = (value: string) => {
        document.cookie = `blackgem_consent=${value}; max-age=31536000; path=/; SameSite=Lax`;
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-350"
            style={{ background: 'rgba(13, 13, 18, 0.97)', backdropFilter: 'blur(8px)' }}
        >
            <div className="border-t border-slate-700">
                <div className="max-w-[1400px] mx-auto px-6 py-4 md:px-12 lg:px-[120px] md:py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <p className="text-[13px] text-slate-400 leading-[1.65] flex-1">
                        By visiting our website, you agree to our{' '}
                        <Link href="/cookies" className="text-slate-200 underline underline-offset-2 decoration-slate-600 hover:text-[#3E5CFF] hover:decoration-[#3E5CFF] transition-colors">
                            Cookie Notice
                        </Link>{' '}
                        and our{' '}
                        <Link href="/privacy" className="text-slate-200 underline underline-offset-2 decoration-slate-600 hover:text-[#3E5CFF] hover:decoration-[#3E5CFF] transition-colors">
                            Online Privacy Statement
                        </Link>
                        . Clicking &ldquo;Accept All&rdquo; means you consent to our use of cookies and similar tracking technologies. Clicking &ldquo;Decline All&rdquo; means you prevent us from using non-essential cookies; however, we will continue to use essential cookies for core website functions.
                    </p>
                    <div className="flex gap-3 shrink-0 flex-row-reverse md:flex-row">
                        <button
                            onClick={() => setCookie('accepted')}
                            className="px-6 py-2.5 bg-[#3E5CFF] border border-[#3E5CFF] text-white text-[13px] font-medium rounded-md hover:bg-[#3350E0] hover:border-[#3350E0] hover:shadow-[0_0_16px_rgba(62,92,255,0.2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3E5CFF]"
                        >
                            Accept All
                        </button>
                        <button
                            onClick={() => setCookie('declined')}
                            className="px-6 py-2.5 bg-transparent border border-slate-700 text-slate-300 text-[13px] font-medium rounded-md hover:border-slate-400 hover:text-slate-100 active:bg-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                        >
                            Decline All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
