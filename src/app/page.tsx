import Image from 'next/image';
import Link from 'next/link';
import {
    TrendingUp,
    Users,
    Building2,
    Wallet,
    FileText,
    Globe,
} from 'lucide-react';
import { ChainPattern } from '@/components/landing/chain-pattern';
import { MobileNav } from '@/components/landing/mobile-nav';
import { FadeIn } from '@/components/landing/fade-in';
import { SectionTransition } from '@/components/landing/section-transition';
import { SmoothScrollLink } from '@/components/landing/smooth-scroll-link';
import { JsonLd } from '@/lib/shared/json-ld';

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
            <JsonLd
                data={{
                    '@type': 'Organization',
                    name: 'BlackGem',
                    url: 'https://www.blackgem.ai',
                    logo: 'https://www.blackgem.ai/images/og-image.jpg',
                    description:
                        'BlackGem is an AI-powered fund management platform for emerging private equity managers and search funds. It automates deal pipeline tracking, LP management, capital operations, quarterly reporting, and investor portal access.',
                    foundingDate: '2024',
                    parentOrganization: {
                        '@type': 'Organization',
                        name: 'NIRO Group LLC',
                    },
                    contactPoint: {
                        '@type': 'ContactPoint',
                        email: 'contact@blackgem.ai',
                        contactType: 'sales',
                    },
                }}
            />
            <JsonLd
                data={{
                    '@type': 'SoftwareApplication',
                    name: 'BlackGem',
                    url: 'https://www.blackgem.ai',
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    description:
                        'AI operating partner for private equity fund operations. Handles deal pipeline management, LP communications, capital calls, distributions, waterfall calculations, quarterly report generation, and institutional-grade investor portal — purpose-built for emerging managers and search funds.',
                    offers: [
                        {
                            '@type': 'Offer',
                            name: 'Search',
                            price: '59',
                            priceCurrency: 'USD',
                            priceSpecification: {
                                '@type': 'UnitPriceSpecification',
                                price: '59',
                                priceCurrency: 'USD',
                                billingDuration: 'P1M',
                            },
                            description:
                                'AI copilot for solo searchers, pre-acquisition. Includes deal pipeline, DD automation, deal scoring, contact management.',
                        },
                        {
                            '@type': 'Offer',
                            name: 'Operate',
                            price: '179',
                            priceCurrency: 'USD',
                            priceSpecification: {
                                '@type': 'UnitPriceSpecification',
                                price: '179',
                                priceCurrency: 'USD',
                                billingDuration: 'P1M',
                            },
                            description:
                                'AI agent for post-acquisition fund management. Includes LP portal, AI-drafted communications, capital operations, waterfall engine, quarterly reports.',
                        },
                        {
                            '@type': 'Offer',
                            name: 'Scale',
                            price: '349',
                            priceCurrency: 'USD',
                            priceSpecification: {
                                '@type': 'UnitPriceSpecification',
                                price: '349',
                                priceCurrency: 'USD',
                                billingDuration: 'P1M',
                            },
                            description:
                                'Full AI operating partner for multi-fund operations. Includes priority model access, advanced analytics, API access, unlimited team members.',
                        },
                    ],
                    featureList: [
                        'AI-Powered Deal Pipeline',
                        'LP Management & Communications',
                        'Capital Operations & Waterfall Engine',
                        'Quarterly Report Generation',
                        'Institutional LP Portal',
                        'AI Copilot & Agent',
                        'Portfolio Monitoring',
                    ],
                    screenshot: 'https://www.blackgem.ai/images/cockpit-preview.png',
                }}
            />
            <JsonLd
                data={{
                    '@type': 'FAQPage',
                    mainEntity: [
                        {
                            '@type': 'Question',
                            name: 'How do emerging PE managers handle fund operations without a back office?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'BlackGem provides an AI operating partner that handles capital calls, LP reports, portfolio monitoring, and quarterly reporting — replacing the 20+ hours/week of operational work that solo GPs typically manage manually. Plans start at $59/month.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: 'What fund management software works for search funds and micro-PE?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'BlackGem is purpose-built for emerging managers and search funds. Plans start at $59/month (vs enterprise platforms at $18K+/year). It includes an AI-powered deal pipeline, LP portal, capital operations with waterfall calculations, and automated quarterly reports.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: "How does BlackGem's AI agent work for fund management?",
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: "BlackGem's AI agent proactively manages fund operations: it tracks deal pipeline stages and flags stalled deals, drafts LP communications and quarterly reports from live fund data, handles capital call calculations with zero-error precision, and monitors portfolio KPIs for anomalies — surfacing what needs the GP's attention.",
                            },
                        },
                    ],
                }}
            />
            <HeroSection />
            <SectionTransition variant="hero-to-problem" />
            <ProblemSection />
            <SectionTransition variant="problem-to-platform" />
            <PlatformSection />
            <DualInterfaceSection />
            <FeaturesSection />
            <SocialProofSection />
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
                    href="/login"
                    className="text-[13px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                    Login
                </a>

                <div className="w-10 h-px bg-slate-700 my-2" />

                <div className="flex flex-col gap-3 pt-2">
                    <span className="text-[15px] font-medium text-heritage-sapphire">
                        Home
                    </span>
                    <NavItem label="The Problem" href="#problem" />
                    <NavItem label="The Platform" href="#platform" />
                    <NavItem label="Pricing" href="/pricing" />
                    <NavItem label="Contact" href="#contact" />
                </div>
            </nav>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-12 lg:px-[100px] max-w-[900px]">
                <div className="flex flex-col gap-6">
                    <FadeIn>
                        <h1 className="font-display text-[32px] md:text-[44px] lg:text-[56px] leading-[1.1] font-normal text-white max-w-[800px]">
                            Your fund&apos;s AI
                            <br />
                            operating partner.
                        </h1>
                    </FadeIn>
                    <FadeIn delay={150}>
                        <p className="text-base md:text-lg text-slate-400 max-w-[700px] leading-relaxed">
                            BlackGem runs your fund operations so you can focus on sourcing deals and creating value.
                        </p>
                    </FadeIn>
                    <FadeIn delay={300}>
                        <div className="pt-2">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-heritage-sapphire text-white text-sm font-semibold rounded-md hover:bg-[#3350E0] transition-all hover:shadow-[0_0_24px_rgba(62,92,255,0.3)]"
                            >
                                Get Started
                            </Link>
                        </div>
                    </FadeIn>
                </div>
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
            stat: 'You\u2019re the GP, the analyst, and the fund admin.',
            label: '',
            description:
                'A $500M fund has 15 people handling what you do alone. Capital calls, LP reports, portfolio monitoring \u2014 it\u2019s 20+ hours/week of operational drag.',
        },
        {
            stat: 'Fund software is built for firms with full-time CFOs.',
            label: '',
            description:
                'The platforms that handle capital calls and LP reporting start at $18K/year and assume you have a team. You need institutional quality at emerging manager economics.',
        },
        {
            stat: 'Your LPs expect institutional reporting. Yesterday.',
            label: '',
            description:
                'Every email asking \u201Cwhat\u2019s my capital account balance?\u201D is a trust erosion event. Your LPs compare you to the $500M fund that sends them a portal login.',
        },
    ];

    return (
        <section id="problem" className="bg-deep-surface pt-8 pb-16 px-6 md:pt-10 md:pb-20 md:px-12 lg:pt-[60px] lg:pb-[100px] lg:px-[120px]">
            <article className="max-w-[1200px] mx-auto">
                <FadeIn>
                    <p className="text-xs font-medium text-heritage-sapphire tracking-[3px] uppercase text-center mb-4 md:mb-6">
                        THE PROBLEM
                    </p>
                </FadeIn>

                <FadeIn delay={100}>
                    <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-8 md:mb-12">
                        Running a fund shouldn&apos;t require
                        <br className="hidden md:block" />
                        {' '}a back office you can&apos;t afford.
                    </h2>
                </FadeIn>

                {/* Problem cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {problems.map((p, i) => (
                        <FadeIn key={p.stat} delay={200 + i * 120}>
                            <div className="landing-card bg-slate-800 border border-slate-700 rounded-lg p-6 md:p-8 flex flex-col gap-4 h-full">
                                <span className="text-base md:text-lg font-medium text-slate-100 leading-snug">
                                    {p.stat}
                                </span>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {p.description}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </article>
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
                        HOW IT WORKS
                    </p>
                </FadeIn>

                <FadeIn delay={100}>
                    <h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
                        An AI agent that runs
                        <br />
                        your fund operations.
                    </h2>
                </FadeIn>

                <FadeIn delay={150}>
                    <p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
                        It briefs you on what matters. It handles the rest.
                    </p>
                </FadeIn>

                {/* Module pills */}
                <FadeIn delay={250}>
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
                        The Cockpit &mdash; Your AI Command Center
                    </h3>
                </FadeIn>
                <FadeIn delay={200}>
                    <p className="text-[15px] text-slate-400 leading-relaxed max-w-[500px] mb-8">
                        AI-powered operations. Your agent manages deals, drafts LP reports, handles capital calls, and monitors your portfolio &mdash; surfacing what needs attention.
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
                        Institutional-grade LP portal. Capital accounts, quarterly reports, and documents &mdash; always current, always accessible.
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
                'From target screening to close. Your AI tracks 18 stages, flags stalled deals, and surfaces what needs your attention this week.',
        },
        {
            icon: Users,
            title: 'LP Management',
            description:
                'Commitments, communications, and portal access. Your AI drafts LP updates and tracks engagement so no relationship goes cold.',
        },
        {
            icon: Building2,
            title: 'Portfolio',
            description:
                'KPIs, financials, company performance. Real-time monitoring with AI-flagged anomalies.',
        },
        {
            icon: Wallet,
            title: 'Capital Operations',
            description:
                'Capital calls, distributions, waterfall calculations. Zero-error precision, automated execution, full audit trail.',
        },
        {
            icon: FileText,
            title: 'Quarterly Reports',
            description:
                'Your AI drafts quarterly reports from live fund data. Review in 4 minutes. Distribute to LPs with one click.',
        },
        {
            icon: Globe,
            title: 'LP Portal',
            description:
                'Documents, statements, reports. Institutional self-service access for your LPs \u2014 24/7.',
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
                        Every fund operation, handled.
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

/* ----- SECTION 6: ETHOS STATEMENT ----- */
function SocialProofSection() {
    return (
        <section className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px] relative overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

            <div className="max-w-[1200px] mx-auto">
                <FadeIn>
                    <p className="font-display text-[22px] md:text-[28px] lg:text-[32px] text-slate-400 text-center leading-relaxed">
                        Built by fund operators who got tired of building Excel models at 2am.
                    </p>
                </FadeIn>
            </div>
        </section>
    );
}

/* ----- SECTION 7: FINAL CTA ----- */
function FinalCtaSection() {
    return (
        <section id="contact" className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px] relative overflow-hidden">
            {/* Atmospheric glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_40%,rgba(62,92,255,0.05),transparent)] pointer-events-none" aria-hidden="true" />

            <div className="max-w-[800px] mx-auto text-center relative z-10">
                <FadeIn>
                    <h2 className="font-display text-[28px] md:text-[36px] lg:text-[44px] leading-[1.15] font-normal text-white mb-6 md:mb-8">
                        Your operations, handled.
                    </h2>
                </FadeIn>

                <FadeIn delay={200}>
                    <Link
                        href="/register"
                        className="inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 bg-heritage-sapphire text-white text-sm md:text-[15px] font-semibold rounded-md hover:bg-[#3350E0] transition-all hover:shadow-[0_0_32px_rgba(62,92,255,0.3)]"
                    >
                        Get Started
                    </Link>
                </FadeIn>
            </div>
        </section>
    );
}

/* ----- SECTION 9: FOOTER ----- */
function FooterSection() {
    const columns = [
        {
            title: 'Product',
            links: [
                { label: 'Pricing', href: '/pricing' },
                { label: 'Login', href: '/login' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'Contact', href: 'mailto:contact@blackgem.ai' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Security', href: '/security' },
            ],
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
                            A product of NIRO Group LLC.
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
                                        key={link.label}
                                        href={link.href}
                                        className="text-[13px] text-slate-400 hover:text-heritage-sapphire transition-colors"
                                    >
                                        {link.label}
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
                </div>
            </div>
        </footer>
    );
}
