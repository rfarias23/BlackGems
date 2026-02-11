import Link from 'next/link';
import {
    TrendingUp,
    Users,
    Building2,
    Wallet,
    FileText,
    Globe,
    Check,
    Linkedin,
    Twitter,
} from 'lucide-react';
import { ChainPattern } from '@/components/landing/chain-pattern';
import { MobileNav } from '@/components/landing/mobile-nav';

/* =============================================
   BLACKGEM LANDING PAGE — Responsive
   Sections 1-9: Hero, Problem, Platform, Dual Interface, Features,
                 Social Proof, Pricing, Final CTA, Footer
   Breakpoints: mobile-first → md (768px) → lg (1024px) → xl (1280px)
   Design reference: Desing & UI/12_Landing_Page_Guide.md
   ============================================= */

export default function Home() {
    return (
        <main className="bg-midnight-ink text-slate-100">
            <HeroSection />
            <ProblemSection />
            <PlatformSection />
            <DualInterfaceSection />
            <FeaturesSection />
            <SocialProofSection />
            <PricingSection />
            <FinalCtaSection />
            <FooterSection />
        </main>
    );
}

/* ----- SECTION 1: HERO ----- */
function HeroSection() {
    return (
        <section className="relative min-h-screen overflow-hidden bg-midnight-ink">
            {/* Decorative chain pattern — hidden on mobile */}
            <div className="hidden lg:block">
                <ChainPattern />
            </div>

            {/* Top bar: Logo + mobile menu toggle */}
            <div className="absolute top-8 left-6 md:top-12 md:left-12 lg:left-[100px] z-20">
                <Link href="/" className="flex items-baseline gap-0">
                    <span className="font-serif text-lg text-slate-100 font-normal tracking-tight">
                        Black
                    </span>
                    <span className="font-serif text-lg text-slate-100 font-semibold tracking-tight">
                        Gem
                    </span>
                </Link>
            </div>

            {/* Mobile navigation */}
            <MobileNav />

            {/* Desktop right-side navigation — hidden below lg */}
            <nav className="hidden lg:flex absolute right-[100px] top-[260px] z-10 w-[180px] flex-col gap-2">
                <Link
                    href="/login"
                    className="text-[13px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                    LP Login
                </Link>
                <Link
                    href="/login"
                    className="text-[13px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                    Manager Login
                </Link>

                <div className="w-10 h-px bg-slate-700 my-2" />

                <div className="flex flex-col gap-3 pt-2">
                    <span className="text-[15px] font-medium text-heritage-sapphire">
                        Home
                    </span>
                    <NavItem label="The Problem" href="#problem" />
                    <NavItem label="The Platform" href="#platform" />
                    <NavItem label="Pricing" href="#pricing" />
                    <Link
                        href="#contact"
                        className="text-[15px] text-slate-100 hover:text-heritage-sapphire transition-colors"
                    >
                        Contact
                    </Link>
                </div>
            </nav>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-12 lg:px-[100px] max-w-[900px]">
                <div className="flex flex-col gap-6">
                    {/* H1: Fraunces 56px normal #FFFFFF */}
                    <h1 className="font-display text-[32px] md:text-[44px] lg:text-[56px] leading-[1.1] font-normal text-white max-w-[800px]">
                        Institutional excellence
                        <br />
                        from day one.
                    </h1>
                    <p className="text-base md:text-lg text-slate-400 max-w-[700px] leading-relaxed">
                        Private equity infrastructure for the next generation of fund managers.
                    </p>
                    <div className="pt-2">
                        <Link
                            href="#contact"
                            className="inline-flex items-center justify-center px-8 py-3.5 bg-heritage-sapphire text-white text-sm font-semibold rounded-md hover:bg-[#3350E0] transition-colors"
                        >
                            Request a Demo
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer mark — hidden on mobile */}
            <div className="hidden md:block absolute bottom-10 right-6 md:right-12 lg:right-[100px] z-10">
                <span className="font-serif text-sm font-medium text-slate-600">
                    BlackGem
                </span>
            </div>
        </section>
    );
}

function NavItem({ label, href }: { label: string; href: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 group"
        >
            <span className="text-xs text-slate-600 group-hover:text-heritage-sapphire transition-colors">
                &gt;
            </span>
            <span className="text-[15px] text-slate-100 group-hover:text-heritage-sapphire transition-colors">
                {label}
            </span>
        </Link>
    );
}

/* ----- SECTION 2: THE PROBLEM ----- */
function ProblemSection() {
    const problems = [
        {
            stat: '8-10 hrs',
            label: 'per week on admin',
            description:
                'Hours spent updating spreadsheets, sending LP emails, compiling reports.',
        },
        {
            stat: 'Manual',
            label: 'capital calculations',
            description:
                'Error-prone Excel formulas for capital accounts, pro-rata, and waterfalls.',
        },
        {
            stat: 'Zero',
            label: 'LP visibility',
            description:
                'Investors have no self-service access. Every question requires an email.',
        },
    ];

    return (
        <section id="problem" className="bg-deep-surface py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                {/* Section label */}
                <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                    THE PROBLEM
                </p>

                {/* H2: Fraunces 40px normal */}
                <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-8 md:mb-12">
                    Fund managers spend more time
                    <br className="hidden md:block" />
                    {' '}on spreadsheets than on deals.
                </h2>

                {/* Problem cards — 1 col mobile, 3 cols desktop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {problems.map((p) => (
                        <div
                            key={p.stat}
                            className="bg-slate-800 border border-slate-700 rounded-lg p-6 md:p-8 flex flex-col gap-4"
                        >
                            <span className="font-mono text-3xl md:text-4xl font-medium text-heritage-sapphire">
                                {p.stat}
                            </span>
                            <span className="text-sm font-medium text-slate-100">
                                {p.label}
                            </span>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {p.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 3: THE PLATFORM ----- */
function PlatformSection() {
    const modules = ['Deals', 'Investors', 'Portfolio', 'Capital', 'Reports'];

    return (
        <section id="platform" className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                {/* Section label */}
                <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                    THE PLATFORM
                </p>

                {/* H2: Fraunces 40px normal */}
                <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
                    Everything a fund needs.
                    <br />
                    Nothing it doesn&apos;t.
                </h2>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
                    One platform for deals, investors, portfolio, capital, and reporting.
                </p>

                {/* Screenshot placeholder — responsive height */}
                <div className="w-full max-w-[1100px] mx-auto h-[240px] md:h-[400px] lg:h-[520px] bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mb-6 md:mb-8">
                    <span className="text-base text-slate-600">Dashboard Screenshot</span>
                </div>

                {/* Module pills — wrap on mobile */}
                <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                    {modules.map((m) => (
                        <span
                            key={m}
                            className="px-4 py-1.5 md:px-5 md:py-2 bg-slate-800 border border-slate-700 rounded-full text-[12px] md:text-[13px] font-medium text-slate-400"
                        >
                            {m}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 4: DUAL INTERFACE ----- */
function DualInterfaceSection() {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[700px]">
            {/* Left: The Cockpit (dark) */}
            <div className="bg-midnight-ink py-12 px-6 md:py-16 md:px-12 lg:py-20 lg:pl-[120px] lg:pr-16 flex flex-col justify-center">
                <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase mb-4">
                    FOR FUND MANAGERS
                </p>
                {/* H3: Fraunces 36px normal */}
                <h3 className="font-display text-3xl md:text-4xl font-normal text-slate-100 mb-4">
                    The Cockpit
                </h3>
                <p className="text-[15px] text-slate-400 leading-relaxed max-w-[500px] mb-8">
                    Dark mode. Built for efficiency. Track deals, manage capital, monitor portfolio.
                </p>
                <div className="w-full max-w-[500px] h-[220px] md:h-[320px] bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-slate-600">Cockpit Preview</span>
                </div>
            </div>

            {/* Right: The Library (light) */}
            <div className="bg-soft-parchment py-12 px-6 md:py-16 md:px-12 lg:py-20 lg:pr-[120px] lg:pl-16 flex flex-col justify-center">
                <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase mb-4">
                    FOR INVESTORS
                </p>
                {/* H3: Fraunces 36px normal */}
                <h3 className="font-display text-3xl md:text-4xl font-normal text-slate-800 mb-4">
                    The Library
                </h3>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-[500px] mb-8">
                    Clean portal. Documents, reports, and capital accounts — 24/7 self-service.
                </p>
                <div className="w-full max-w-[500px] h-[220px] md:h-[320px] bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-slate-400">Library Preview</span>
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 5: FEATURES / CAPABILITIES ----- */
function FeaturesSection() {
    const features = [
        {
            icon: TrendingUp,
            title: 'Deal Pipeline',
            description:
                'Track acquisitions from review to close. 18 stages, DD tracker, contacts.',
        },
        {
            icon: Users,
            title: 'LP Management',
            description:
                'Commitments, communications, portal access. Professional from day one.',
        },
        {
            icon: Building2,
            title: 'Portfolio',
            description:
                'KPIs, financials, company performance. Everything post-acquisition.',
        },
        {
            icon: Wallet,
            title: 'Capital Operations',
            description:
                'Capital calls, distributions, waterfall. Automated and accurate.',
        },
        {
            icon: FileText,
            title: 'Quarterly Reports',
            description:
                'One-click professional PDFs. Auto-populated, institutional quality.',
        },
        {
            icon: Globe,
            title: 'LP Portal',
            description:
                'White-label. Documents, statements, reports — 24/7 self-service for LPs.',
        },
    ];

    return (
        <section className="bg-deep-surface py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                {/* Section label */}
                <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                    CAPABILITIES
                </p>

                {/* H2: Fraunces 40px normal */}
                <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-8 md:mb-12">
                    Built for how funds actually work.
                </h2>

                {/* Feature grid: 1 col mobile → 2 cols tablet → 3 cols desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="bg-slate-800 border border-slate-700 rounded-lg p-6 md:p-8 flex flex-col gap-3"
                        >
                            <f.icon className="w-6 h-6 text-heritage-sapphire" />
                            <h4 className="text-base font-semibold text-slate-100">
                                {f.title}
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 6: SOCIAL PROOF / METRICS ----- */
function SocialProofSection() {
    const metrics = [
        { value: '70%', color: 'text-heritage-sapphire', label: 'Time saved on admin' },
        { value: '0', color: 'text-emerald-forest', label: 'Calculation errors' },
        { value: '<60s', color: 'text-slate-100', label: 'To add a new deal' },
        { value: '24/7', color: 'text-slate-100', label: 'LP portal access' },
    ];

    return (
        <section className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                {/* Metrics row — 2x2 grid on mobile, single row on desktop */}
                <div className="grid grid-cols-2 md:flex md:items-start md:justify-around gap-8 md:gap-0 mb-12 md:mb-16">
                    {metrics.map((m) => (
                        <div key={m.value} className="flex flex-col items-center gap-2 md:gap-3">
                            <span className={`font-mono text-[36px] md:text-[48px] font-light ${m.color}`}>
                                {m.value}
                            </span>
                            <span className="text-xs md:text-sm text-slate-400 text-center">
                                {m.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-full max-w-[800px] mx-auto h-px bg-slate-700 mb-12 md:mb-16" />

                {/* Testimonial: Source Serif 4 italic */}
                <div className="text-center max-w-[800px] mx-auto px-2">
                    <p className="font-serif text-lg md:text-xl italic text-slate-400 leading-relaxed mb-4">
                        &ldquo;BlackGem made our $5M fund look like a $500M operation. Our LPs noticed immediately.&rdquo;
                    </p>
                    <span className="text-sm font-medium text-slate-600">
                        — Search Fund Principal, Former Goldman Sachs
                    </span>
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 7: PRICING ----- */
function PricingSection() {
    const tiers = [
        {
            name: 'Searcher',
            price: '49',
            description: 'Perfect for search fund principals in the acquisition phase.',
            features: [
                'Deal pipeline & DD tracker',
                'Contact management',
                '2 users, 5GB storage',
            ],
            cta: 'Get Started',
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
            highlighted: true,
        },
        {
            name: 'Fund Manager',
            price: '399',
            description: 'For established funds with multiple vehicles and advanced needs.',
            features: [
                'Everything in Operator',
                'Multi-fund management',
                'White-label portal & API',
                'Unlimited users & storage',
            ],
            cta: 'Contact Sales',
            highlighted: false,
        },
    ];

    return (
        <section id="pricing" className="bg-deep-surface py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                {/* Section label */}
                <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                    PRICING
                </p>

                {/* H2: Fraunces 40px normal */}
                <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
                    Right-sized for every stage.
                </h2>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
                    No AUM-based pricing. No per-seat fees. Predictable.
                </p>

                {/* Pricing cards — 1 col mobile, 3 cols desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`bg-slate-800 rounded-lg p-6 md:p-9 flex flex-col border ${
                                tier.highlighted
                                    ? 'border-heritage-sapphire'
                                    : 'border-slate-700'
                            }`}
                        >
                            {/* Badge */}
                            {tier.highlighted && (
                                <span className="inline-flex self-start px-3 py-1 bg-heritage-sapphire text-white text-[11px] font-semibold rounded-full mb-4">
                                    Most Popular
                                </span>
                            )}

                            {/* Tier name */}
                            <span className="text-sm font-medium text-slate-400 mb-3">
                                {tier.name}
                            </span>

                            {/* Price */}
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="font-mono text-3xl md:text-4xl font-medium text-slate-100">
                                    &euro;{tier.price}
                                </span>
                                <span className="text-sm text-slate-600">/mo</span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                {tier.description}
                            </p>

                            {/* Divider */}
                            <div className="h-px bg-slate-700 mb-6" />

                            {/* Features */}
                            <ul className="flex flex-col gap-3 mb-8 flex-1">
                                {tier.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-forest shrink-0" />
                                        <span className="text-sm text-slate-400">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                className={`w-full py-3 rounded-md text-sm font-medium transition-colors ${
                                    tier.highlighted
                                        ? 'bg-heritage-sapphire text-white hover:bg-[#3350E0]'
                                        : 'bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500'
                                }`}
                            >
                                {tier.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 8: FINAL CTA ----- */
function FinalCtaSection() {
    return (
        <section id="contact" className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px]">
            <div className="max-w-[800px] mx-auto text-center">
                {/* CTA H2: Fraunces 44px normal */}
                <h2 className="font-display text-[28px] md:text-[36px] lg:text-[44px] leading-[1.15] font-normal text-white mb-4">
                    Your fund deserves better
                    <br className="hidden md:block" />
                    {' '}than spreadsheets.
                </h2>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-slate-400 mb-6 md:mb-8">
                    Join the next generation of fund managers.
                </p>

                {/* CTA */}
                <Link
                    href="#contact"
                    className="inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 bg-heritage-sapphire text-white text-sm md:text-[15px] font-semibold rounded-md hover:bg-[#3350E0] transition-colors"
                >
                    Request a Demo
                </Link>

                {/* Trust line */}
                <p className="mt-5 md:mt-6 text-[12px] md:text-[13px] text-slate-600">
                    No credit card required &middot; Free onboarding &middot; Setup in minutes
                </p>
            </div>
        </section>
    );
}

/* ----- SECTION 9: FOOTER ----- */
function FooterSection() {
    const columns = [
        {
            title: 'Platform',
            links: ['Deals', 'Investors', 'Portfolio', 'Capital', 'Reports'],
        },
        {
            title: 'Company',
            links: ['About', 'Pricing', 'Blog', 'Contact'],
        },
        {
            title: 'Legal',
            links: ['Privacy', 'Terms', 'Security'],
        },
    ];

    return (
        <footer className="bg-deep-surface pt-12 pb-8 px-6 md:pt-16 md:pb-10 md:px-12 lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                {/* Top row: brand + columns */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0 mb-8 md:mb-10">
                    {/* Brand column */}
                    <div className="flex flex-col gap-2">
                        <span className="font-serif text-lg tracking-tight text-slate-100">
                            <span className="font-normal">Black</span><span className="font-semibold">Gem</span>
                        </span>
                        <span className="text-[13px] text-slate-600">
                            Institutional excellence from day one.
                        </span>
                    </div>

                    {/* Link columns — 3 cols on mobile too, but with smaller gaps */}
                    <div className="grid grid-cols-3 gap-8 md:flex md:gap-24">
                        {columns.map((col) => (
                            <div key={col.title} className="flex flex-col gap-3">
                                <span className="text-xs font-medium text-slate-100">
                                    {col.title}
                                </span>
                                {col.links.map((link) => (
                                    <Link
                                        key={link}
                                        href="#"
                                        className="text-[13px] text-slate-400 hover:text-heritage-sapphire transition-colors"
                                    >
                                        {link}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-700 mb-6" />

                {/* Bottom bar */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                        &copy; 2026 NIRO Group LLC. All rights reserved.
                    </span>
                    <div className="flex items-center gap-4">
                        <Link href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
                            <Linkedin className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
                            <Twitter className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
