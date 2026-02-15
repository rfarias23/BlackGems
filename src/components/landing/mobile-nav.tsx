'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

/**
 * MobileNav — Hamburger menu for mobile/tablet viewports (below lg breakpoint).
 * Full-screen overlay with navigation links matching the desktop sidebar nav.
 */
export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    const close = () => setIsOpen(false);

    return (
        <>
            {/* Hamburger button — visible below lg */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden absolute top-8 right-6 md:top-12 md:right-12 z-20 text-slate-400 hover:text-slate-100 transition-colors"
                aria-label="Open navigation"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-midnight-ink/98 flex flex-col">
                    {/* Close button */}
                    <button
                        onClick={close}
                        className="absolute top-8 right-6 md:top-12 md:right-12 text-slate-400 hover:text-slate-100 transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Logo */}
                    <div className="pt-8 pl-6 md:pt-12 md:pl-12">
                        <Link href="/" className="flex items-baseline gap-0" onClick={close}>
                            <span className="font-serif text-lg text-slate-100 font-normal tracking-tight">
                                Black
                            </span>
                            <span className="font-serif text-lg text-slate-100 font-semibold tracking-tight">
                                Gem
                            </span>
                        </Link>
                    </div>

                    {/* Nav links */}
                    <nav className="flex-1 flex flex-col justify-center items-center gap-6">
                        <NavLink href="#problem" label="The Problem" onClick={close} />
                        <NavLink href="#platform" label="The Platform" onClick={close} />
                        <NavLink href="#pricing" label="Pricing" onClick={close} />
                        <NavLink href="#contact" label="Contact" onClick={close} />

                        <div className="w-12 h-px bg-slate-700 my-2" />

                        <Link
                            href="/login"
                            onClick={close}
                            className="text-[15px] text-slate-400 hover:text-slate-100 transition-colors"
                        >
                            Manager Login
                        </Link>

                        <div className="mt-4">
                            <Link
                                href="#contact"
                                onClick={close}
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-heritage-sapphire text-white text-sm font-semibold rounded-md hover:bg-[#3350E0] transition-colors"
                            >
                                Request a Demo
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}

function NavLink({
    href,
    label,
    onClick,
}: {
    href: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="text-2xl font-display font-normal text-slate-100 hover:text-heritage-sapphire transition-colors"
        >
            {label}
        </Link>
    );
}
