'use client';

import { useEffect, useRef } from 'react';

/**
 * SectionTransition — Gradient blend zones between landing page sections.
 *
 * These sit BETWEEN sections in the main layout, creating a smooth
 * visual gradient from one background color to the next, plus a
 * sapphire accent line that animates on scroll.
 *
 * Variants:
 *   - hero-to-problem:    midnight-ink → deep-surface  (dramatic, with sapphire glow)
 *   - problem-to-platform: deep-surface → midnight-ink  (structured, rising energy)
 *   - to-pricing:          midnight-ink → deep-surface  (beacon with diamond accent)
 */
export function SectionTransition({
    variant,
    className = '',
}: {
    variant: 'hero-to-problem' | 'problem-to-platform' | 'to-pricing';
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('transition-active');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`section-blend section-blend--${variant} ${className}`}
            aria-hidden="true"
        >
            {/* Sapphire accent line */}
            <div className="section-blend__line" />

            {/* Diamond center for pricing beacon */}
            {variant === 'to-pricing' && (
                <div className="section-blend__diamond" />
            )}
        </div>
    );
}
