'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * FadeIn — Scroll-triggered reveal animation using Intersection Observer.
 * Wraps children in a div that fades + slides up on first viewport entry.
 */
export function FadeIn({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Apply delay then reveal
                    setTimeout(() => {
                        el.classList.add('animate-in');
                    }, delay);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`fade-in-up ${className}`}>
            {children}
        </div>
    );
}

/**
 * StaggerChildren — Wraps multiple children with staggered fade-in delays.
 */
export function StaggerChildren({
    children,
    staggerMs = 100,
    className = '',
}: {
    children: ReactNode[];
    staggerMs?: number;
    className?: string;
}) {
    return (
        <>
            {children.map((child, i) => (
                <FadeIn key={i} delay={i * staggerMs} className={className}>
                    {child}
                </FadeIn>
            ))}
        </>
    );
}
