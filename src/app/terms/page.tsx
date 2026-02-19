import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'BlackGem terms of service.',
    alternates: {
        canonical: '/terms',
    },
};

export default function TermsPage() {
    return (
        <main className="bg-midnight-ink text-slate-100 min-h-screen">
            <div className="pt-8 pl-6 md:pt-12 md:pl-12 lg:pl-[100px]">
                <Link href="/" className="flex items-baseline gap-0">
                    <span className="font-serif text-[25px] text-slate-100 font-normal tracking-tight">Black</span>
                    <span className="font-serif text-[25px] text-slate-100 font-semibold tracking-tight">Gem</span>
                </Link>
            </div>
            <section className="pt-16 pb-20 px-6 md:pt-20 md:pb-24 md:px-12 lg:pt-[80px] lg:pb-[120px] lg:px-[120px]">
                <div className="max-w-[700px] mx-auto">
                    <h1 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 mb-6">Terms of Service</h1>
                    <p className="text-base text-slate-400 leading-relaxed">
                        Our terms of service are being finalized. For questions, contact us at{' '}
                        <a href="mailto:contact@blackgem.ai" className="text-heritage-sapphire hover:underline">contact@blackgem.ai</a>.
                    </p>
                </div>
            </section>
        </main>
    );
}
