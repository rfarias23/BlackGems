import Image from 'next/image';
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
import { FadeIn } from '@/components/landing/fade-in';
import { SectionTransition } from '@/components/landing/section-transition';
import { SmoothScrollLink } from '@/components/landing/smooth-scroll-link';

/* =============================================
   BLACKGEM LANDING PAGE — Responsive + Animated
   Sections 1-9: Hero, Problem, Platform, Dual Interface, Features,
                 Social Proof, Pricing, Final CTA, Footer
   Breakpoints: mobile-first → md (768px) → lg (1024px) → xl (1280px)
   Design reference: Desing & UI/12_Landing_Page_Guide.md
   ============================================= */

export default function Home() {
    return (
        <main className="bg-midnight-ink text-slate-100">
            <HeroSection />
            <SectionTransition variant="hero-to-problem" />
            <ProblemSection />
            <SectionTransition variant="problem-to-platform" />
            <PlatformSection />
            <DualInterfaceSection />
            <FeaturesSection />
            <SocialProofSection />
            <SectionTransition variant="to-pricing" />
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
            {/* Ambient glow — atmospheric depth */}
            <div className="hero-glow absolute inset-0 pointer-events-none" aria-hidden="true" />

            {/* Decorative chain pattern — visible on all sizes */}
            <div className="chain-breathe">
                <ChainPattern />
            </div>

            {/* Top bar: Logo + mobile menu toggle */}
            <div className="absolute top-8 left-6 md:top-12 md:left-12 lg:left-[100px] z-20">
                <Link href="/" className="flex items-baseline gap-0">
                    <span className="font-serif text-[25px] text-slate-100 font-normal tracking-tight">
                        Black
                    </span>
                    <span className="font-serif text-[25px] text-slate-100 font-semibold tracking-tight">
                        Gem
                    </span>
                </Link>
            </div>

            {/* Mobile navigation */}
            <MobileNav />

            {/* Desktop right-side navigation — hidden below lg */}
            <nav className="hidden lg:flex absolute right-[100px] top-[260px] z-10 w-[180px] flex-col gap-2">
                <a
                    href="/portal"
                    className="text-[13px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                    LP Login
                </a>
                <a
                    href="/login"
                    className="text-[13px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                    Manager Login
                </a>

                <div className="w-10 h-px bg-slate-700 my-2" />

                <div className="flex flex-col gap-3 pt-2">
                    <span className="text-[15px] font-medium text-heritage-sapphire">
                        Home
                    </span>
                    <NavItem label="The Problem" href="#problem" />
                    <NavItem label="The Platform" href="#platform" />
                    <NavItem label="Pricing" href="#pricing" />
                    <NavItem label="Contact" href="#contact" />
                </div>
            </nav>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-12 lg:px-[100px] max-w-[900px]">
                <div className="flex flex-col gap-6">
                    <FadeIn>
                        <h1 className="font-display text-[32px] md:text-[44px] lg:text-[56px] leading-[1.1] font-normal text-white max-w-[800px]">
                            Institutional excellence
                            <br />
                            from day one.
                        </h1>
                    </FadeIn>
                    <FadeIn delay={150}>
                        <p className="text-base md:text-lg text-slate-400 max-w-[700px] leading-relaxed">
                            Private equity infrastructure for the next generation of fund managers.
                        </p>
                    </FadeIn>
                    <FadeIn delay={300}>
                        <div className="pt-2">
                            <SmoothScrollLink
                                href="#contact"
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-heritage-sapphire text-white text-sm font-semibold rounded-md hover:bg-[#3350E0] transition-all hover:shadow-[0_0_24px_rgba(62,92,255,0.3)]"
                            >
                                Request a Demo
                            </SmoothScrollLink>
                        </div>
                    </FadeIn>
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
        <SmoothScrollLink
            href={href}
            className="flex items-center gap-2 group"
        >
            <span className="text-xs text-slate-600 group-hover:text-heritage-sapphire transition-colors">
                &gt;
            </span>
            <span className="text-[15px] text-slate-100 group-hover:text-heritage-sapphire transition-colors">
                {label}
            </span>
        </SmoothScrollLink>
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
        <section id="problem" className="bg-deep-surface pt-8 pb-16 px-6 md:pt-10 md:pb-20 md:px-12 lg:pt-[60px] lg:pb-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                        THE PROBLEM
                    </p>
                </FadeIn>

                <FadeIn delay={100}>
                    <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-8 md:mb-12">
                        Fund managers spend more time
                        <br className="hidden md:block" />
                        {' '}on spreadsheets than on deals.
                    </h2>
                </FadeIn>

                {/* Problem cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {problems.map((p, i) => (
                        <FadeIn key={p.stat} delay={200 + i * 120}>
                            <div className="landing-card bg-slate-800 border border-slate-700 rounded-lg p-6 md:p-8 flex flex-col gap-4 h-full">
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
                        </FadeIn>
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
        <section id="platform" className="bg-midnight-ink pt-8 pb-16 px-6 md:pt-10 md:pb-20 md:px-12 lg:pt-[60px] lg:pb-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                        THE PLATFORM
                    </p>
                </FadeIn>

                <FadeIn delay={100}>
                    <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
                        Everything a fund needs.
                        <br />
                        Nothing it doesn&apos;t.
                    </h2>
                </FadeIn>

                <FadeIn delay={150}>
                    <p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
                        One platform for deals, investors, portfolio, capital, and reporting.
                    </p>
                </FadeIn>

                {/* Screenshot placeholder */}
                <FadeIn delay={250}>
                    <div className="w-full max-w-[1100px] mx-auto h-[240px] md:h-[400px] lg:h-[520px] bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mb-6 md:mb-8 overflow-hidden relative">
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-heritage-sapphire/[0.03] to-transparent pointer-events-none" />
                        <span className="text-base text-slate-600 relative z-10">Platform Screenshot</span>
                    </div>
                </FadeIn>

                {/* Module pills */}
                <FadeIn delay={350}>
                    <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                        {modules.map((m) => (
                            <span
                                key={m}
                                className="px-4 py-1.5 md:px-5 md:py-2 bg-slate-800 border border-slate-700 rounded-full text-[12px] md:text-[13px] font-medium text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors cursor-default"
                            >
                                {m}
                            </span>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

/* ----- SECTION 4: DUAL INTERFACE ----- */
function DualInterfaceSection() {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[700px]">
            {/* Left: The Cockpit (dark) */}
            <div className="bg-midnight-ink py-12 px-6 md:py-16 md:px-12 lg:py-20 lg:pl-[120px] lg:pr-16 flex flex-col justify-center relative overflow-hidden">
                {/* Subtle radial accent */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_40%_50%_at_70%_0%,rgba(62,92,255,0.04),transparent)] pointer-events-none" aria-hidden="true" />

                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase mb-4">
                        FOR FUND MANAGERS
                    </p>
                </FadeIn>
                <FadeIn delay={100}>
                    <h3 className="font-display text-3xl md:text-4xl font-normal text-slate-100 mb-4">
                        The Cockpit
                    </h3>
                </FadeIn>
                <FadeIn delay={200}>
                    <p className="text-[15px] text-slate-400 leading-relaxed max-w-[500px] mb-8">
                        Dark mode. Built for efficiency. Track deals, manage capital, monitor portfolio.
                    </p>
                </FadeIn>
                <FadeIn delay={300}>
                    <div className="landing-card w-full max-w-[500px] h-[220px] md:h-[320px] bg-slate-800 border border-slate-700 rounded-lg overflow-hidden relative">
                        <Image
                            src="/images/cockpit-preview.png"
                            alt="BlackGem Manager Dashboard — Deal Pipeline"
                            className="w-full h-full object-cover object-top"
                            fill
                            sizes="500px"
                            priority
                        />
                    </div>
                </FadeIn>
            </div>

            {/* Right: The Library (light) */}
            <div className="bg-soft-parchment py-12 px-6 md:py-16 md:px-12 lg:py-20 lg:pr-[120px] lg:pl-16 flex flex-col justify-center relative overflow-hidden">
                {/* Subtle radial accent */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_40%_50%_at_30%_100%,rgba(62,92,255,0.04),transparent)] pointer-events-none" aria-hidden="true" />

                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase mb-4">
                        FOR INVESTORS
                    </p>
                </FadeIn>
                <FadeIn delay={100}>
                    <h3 className="font-display text-3xl md:text-4xl font-normal text-slate-800 mb-4">
                        The Library
                    </h3>
                </FadeIn>
                <FadeIn delay={200}>
                    <p className="text-[15px] text-slate-600 leading-relaxed max-w-[500px] mb-8">
                        Clean portal. Documents, reports, and capital accounts — 24/7 self-service.
                    </p>
                </FadeIn>
                <FadeIn delay={300}>
                    <div className="landing-card w-full max-w-[500px] h-[220px] md:h-[320px] bg-white border border-slate-200 rounded-lg overflow-hidden relative">
                        <Image
                            src="/images/library-preview.png"
                            alt="BlackGem LP Portal — Investment Overview"
                            className="w-full h-full object-cover object-top"
                            fill
                            sizes="500px"
                        />
                    </div>
                </FadeIn>
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
                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                        CAPABILITIES
                    </p>
                </FadeIn>

                <FadeIn delay={100}>
                    <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-8 md:mb-12">
                        Built for how funds actually work.
                    </h2>
                </FadeIn>

                {/* Feature grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {features.map((f, i) => (
                        <FadeIn key={f.title} delay={200 + i * 100}>
                            <div className="landing-card bg-slate-800 border border-slate-700 rounded-lg p-6 md:p-8 flex flex-col gap-3 h-full group">
                                <f.icon className="w-6 h-6 text-heritage-sapphire transition-transform group-hover:scale-110" />
                                <h4 className="text-base font-semibold text-slate-100">
                                    {f.title}
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {f.description}
                                </p>
                            </div>
                        </FadeIn>
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
        <section className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px] relative overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

            <div className="max-w-[1200px] mx-auto">
                {/* Metrics row */}
                <div className="grid grid-cols-2 md:flex md:items-start md:justify-around gap-8 md:gap-0 mb-12 md:mb-16">
                    {metrics.map((m, i) => (
                        <FadeIn key={m.value} delay={i * 150}>
                            <div className="flex flex-col items-center gap-2 md:gap-3 relative">
                                {/* Glow behind the number */}
                                <span className={`metric-glow font-mono text-[36px] md:text-[48px] font-light ${m.color}`} aria-hidden="true">
                                    {m.value}
                                </span>
                                <span className={`font-mono text-[36px] md:text-[48px] font-light ${m.color} relative`}>
                                    {m.value}
                                </span>
                                <span className="text-xs md:text-sm text-slate-400 text-center">
                                    {m.label}
                                </span>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Divider */}
                <div className="section-divider h-px w-full max-w-[800px] mx-auto mb-12 md:mb-16" aria-hidden="true" />

                {/* Testimonial */}
                <FadeIn>
                    <div className="text-center max-w-[800px] mx-auto px-2">
                        <p className="font-serif text-lg md:text-xl italic text-slate-400 leading-relaxed mb-4">
                            &ldquo;BlackGem made our $5M fund look like a $500M operation. Our LPs noticed immediately.&rdquo;
                        </p>
                        <span className="text-sm font-medium text-slate-600">
                            — Search Fund Principal, Former Goldman Sachs
                        </span>
                    </div>
                </FadeIn>
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
        <section id="pricing" className="bg-deep-surface pt-8 pb-16 px-6 md:pt-10 md:pb-20 md:px-12 lg:pt-[60px] lg:pb-[100px] lg:px-[120px]">
            <div className="max-w-[1200px] mx-auto">
                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                        PRICING
                    </p>
                </FadeIn>

                <FadeIn delay={100}>
                    <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
                        Right-sized for every stage.
                    </h2>
                </FadeIn>

                <FadeIn delay={150}>
                    <p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
                        No AUM-based pricing. No per-seat fees. Predictable.
                    </p>
                </FadeIn>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {tiers.map((tier, i) => (
                        <FadeIn key={tier.name} delay={250 + i * 120}>
                            <div
                                className={`landing-card ${tier.highlighted ? 'landing-card-highlight' : ''} bg-slate-800 rounded-lg p-6 md:p-9 flex flex-col border h-full ${
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

                                <button
                                    className={`w-full py-3 rounded-md text-sm font-medium transition-all ${
                                        tier.highlighted
                                            ? 'bg-heritage-sapphire text-white hover:bg-[#3350E0] hover:shadow-[0_0_20px_rgba(62,92,255,0.25)]'
                                            : 'bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500'
                                    }`}
                                >
                                    {tier.cta}
                                </button>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ----- SECTION 8: FINAL CTA ----- */
function FinalCtaSection() {
    return (
        <section id="contact" className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px] relative overflow-hidden">
            {/* Atmospheric glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_40%,rgba(62,92,255,0.05),transparent)] pointer-events-none" aria-hidden="true" />

            <div className="max-w-[800px] mx-auto text-center relative z-10">
                <FadeIn>
                    <h2 className="font-display text-[28px] md:text-[36px] lg:text-[44px] leading-[1.15] font-normal text-white mb-4">
                        Your fund deserves better
                        <br className="hidden md:block" />
                        {' '}than spreadsheets.
                    </h2>
                </FadeIn>

                <FadeIn delay={150}>
                    <p className="text-base md:text-lg text-slate-400 mb-6 md:mb-8">
                        Join the next generation of fund managers.
                    </p>
                </FadeIn>

                <FadeIn delay={300}>
                    <SmoothScrollLink
                        href="#contact"
                        className="inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 bg-heritage-sapphire text-white text-sm md:text-[15px] font-semibold rounded-md hover:bg-[#3350E0] transition-all hover:shadow-[0_0_32px_rgba(62,92,255,0.3)]"
                    >
                        Request a Demo
                    </SmoothScrollLink>
                </FadeIn>

                <FadeIn delay={400}>
                    <p className="mt-5 md:mt-6 text-[12px] md:text-[13px] text-slate-600">
                        No credit card required &middot; Free onboarding &middot; Setup in minutes
                    </p>
                </FadeIn>
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
            {/* Top gradient divider */}
            <div className="section-divider h-px w-full max-w-[1200px] mx-auto mb-12 md:mb-16" aria-hidden="true" />

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

                    {/* Link columns */}
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
