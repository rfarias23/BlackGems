'use client';

import { useCallback } from 'react';

/**
 * SmoothScrollLink — Anchor link with custom easeOutQuart scroll.
 *
 * Replaces native scroll-behavior:smooth with a JS animation
 * that takes ~1.2s with a decelerating curve for a luxury feel.
 */
export function SmoothScrollLink({
    href,
    children,
    className = '',
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            // Only handle hash links
            if (!href.startsWith('#')) return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const start = window.scrollY;
            const end = target.getBoundingClientRect().top + window.scrollY - 40; // 40px offset for breathing room
            const distance = end - start;
            const duration = 1200; // 1.2s — slow, elegant
            let startTime: number | null = null;

            // easeOutQuart — fast start, long deceleration tail
            function easeOutQuart(t: number): number {
                return 1 - Math.pow(1 - t, 4);
            }

            function step(timestamp: number) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutQuart(progress);

                window.scrollTo(0, start + distance * eased);

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            }

            requestAnimationFrame(step);
        },
        [href]
    );

    return (
        <a href={href} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
