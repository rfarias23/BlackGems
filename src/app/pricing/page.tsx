import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
    const tiers = [
        {
            name: 'Searcher',
            price: '49',
            description: 'For search fund principals in the acquisition phase.',
            features: [
                'Deal pipeline & DD tracker',
                'Contact management',
                '2 users, 5GB storage',
            ],
            cta: 'Get Started',
            href: '/register?type=search',
            highlighted: false,
        },
        {
            name: 'Operator',
            price: '199',
            description: 'For operating search funds with LP investors.',
            features: [
                'Everything in Searcher',
                'LP Portal & communications',
                'Capital ops & reports',
                '5 users, 25GB storage',
            ],
            cta: 'Get Started',
            href: '/register?type=pe',
            highlighted: true,
        },
        {
            name: 'Fund Manager',
            price: '399',
            description: 'For established funds with multiple vehicles.',
            features: [
                'Everything in Operator',
                'Multi-fund management',
                'White-label portal & API',
                'Unlimited users & storage',
            ],
            cta: 'Contact Sales',
            href: '/register?type=pe',
            highlighted: false,
        },
    ];

    return (
        <main className="bg-midnight-ink text-slate-100 min-h-screen">
            {/* Header */}
            <div className="pt-8 pl-6 md:pt-12 md:pl-12 lg:pl-[100px]">
                <Link href="/" className="flex items-baseline gap-0">
                    <span className="font-serif text-[25px] text-slate-100 font-normal tracking-tight">
                        Black
                    </span>
                    <span className="font-serif text-[25px] text-slate-100 font-semibold tracking-tight">
                        Gem
                    </span>
                </Link>
            </div>

            {/* Pricing content */}
            <section className="pt-16 pb-20 px-6 md:pt-20 md:pb-24 md:px-12 lg:pt-[80px] lg:pb-[120px] lg:px-[120px]">
                <div className="max-w-[1200px] mx-auto">
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                        PRICING
                    </p>

                    <h1 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
                        Transparent pricing.
                    </h1>

                    <p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-10 md:mb-14">
                        Flat monthly fee. No AUM basis. No per-seat scaling.
                    </p>

                    {/* Pricing cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`bg-slate-800 rounded-lg p-6 md:p-9 flex flex-col border h-full ${
                                    tier.highlighted
                                        ? 'border-heritage-sapphire'
                                        : 'border-slate-700'
                                }`}
                            >
                                <span className="text-sm font-medium text-slate-400 mb-3">
                                    {tier.name}
                                </span>

                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="font-mono text-3xl md:text-4xl font-medium text-slate-100">
                                        &euro;{tier.price}
                                    </span>
                                    <span className="text-sm text-slate-600">/mo</span>
                                </div>

                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    {tier.description}
                                </p>

                                <div className="h-px bg-slate-700 mb-6" />

                                <ul className="flex flex-col gap-3 mb-8 flex-1">
                                    {tier.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-forest shrink-0" />
                                            <span className="text-sm text-slate-400">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={tier.href}
                                    className={`w-full py-3 rounded-md text-sm font-medium transition-all text-center block ${
                                        tier.highlighted
                                            ? 'bg-heritage-sapphire text-white hover:bg-[#3350E0] hover:shadow-[0_0_20px_rgba(62,92,255,0.25)]'
                                            : 'bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500'
                                    }`}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Minimal footer */}
            <footer className="pb-10 px-6 md:px-12 lg:px-[120px]">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                        BlackGem is a product of NIRO Group LLC. &copy; 2026 All rights reserved.
                    </span>
                    <Link
                        href="/"
                        className="text-[13px] text-slate-400 hover:text-heritage-sapphire transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </footer>
        </main>
    );
}
