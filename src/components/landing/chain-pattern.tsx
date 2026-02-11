'use client';

/**
 * ChainPattern — Decorative background of morphing shapes connected by lines.
 *
 * Pure HTML5/CSS implementation. Each shape is a <div> with CSS `clip-path`
 * animated via @keyframes morph-shape (circle → square → triangle → circle).
 * Shapes have staggered animation-delay to create a cascading wave effect.
 *
 * No SVG. No canvas. No JS animation libraries.
 */

/** Segment definition: how many shapes + connector width */
interface Segment {
    shapes: number;
    connector: number; // px width of the connecting line (0 = no line)
}

/** Row pattern from the original .pen design */
const ROW_PATTERN: Segment[] = [
    { shapes: 2, connector: 40 },
    { shapes: 2, connector: 50 },
    { shapes: 1, connector: 60 },
    { shapes: 2, connector: 50 },
    { shapes: 2, connector: 40 },
    { shapes: 2, connector: 0 },
    { shapes: 1, connector: 50 },
    { shapes: 2, connector: 40 },
    { shapes: 2, connector: 60 },
    { shapes: 1, connector: 0 },
];

const SHAPE_SIZE = 50; // px
const SHAPE_GAP = 8; // px between shapes in same segment
const ROW_COUNT = 8;
const ROW_GAP = 38; // px vertical gap between rows

export function ChainPattern() {
    return (
        <div
            className="absolute top-0 left-0 bottom-0 right-0 lg:right-[300px] overflow-hidden pointer-events-none"
            aria-hidden="true"
        >
            <div className="flex flex-col justify-center h-full" style={{ gap: `${ROW_GAP}px` }}>
                {Array.from({ length: ROW_COUNT }, (_, rowIdx) => (
                    <ChainRow key={rowIdx} rowIndex={rowIdx} />
                ))}
            </div>
        </div>
    );
}

/** A single horizontal row of morphing shapes and connectors */
function ChainRow({ rowIndex }: { rowIndex: number }) {
    const elements: React.ReactNode[] = [];
    let shapeCounter = 0;

    for (let s = 0; s < ROW_PATTERN.length; s++) {
        const seg = ROW_PATTERN[s];

        // Render shapes for this segment
        for (let c = 0; c < seg.shapes; c++) {
            const delay = rowIndex * 1.5 + shapeCounter * 0.4;
            elements.push(
                <MorphShape
                    key={`shape-${s}-${c}`}
                    delay={delay}
                />
            );
            shapeCounter++;

            // Gap between shapes in same segment (except after last)
            if (c < seg.shapes - 1) {
                elements.push(
                    <div
                        key={`gap-${s}-${c}`}
                        style={{ width: `${SHAPE_GAP}px`, flexShrink: 0 }}
                    />
                );
            }
        }

        // Connector line to next segment — animated in sync with shapes
        if (seg.connector > 0) {
            // Connector delay matches the last shape before it
            const connectorDelay = rowIndex * 1.5 + (shapeCounter - 1) * 0.4;
            elements.push(
                <div
                    key={`conn-${s}`}
                    className="chain-connector"
                    style={{
                        width: `${seg.connector}px`,
                        flexShrink: 0,
                        animationDelay: `${connectorDelay}s`,
                    }}
                />
            );
        }
    }

    return (
        <div className="flex items-center" style={{ height: `${SHAPE_SIZE}px` }}>
            {elements}
        </div>
    );
}

/**
 * A single morphing shape using the double-layer clip-path technique.
 * Outer div (white bg + morph-outer) creates the shape fill.
 * Inner ::after (dark bg + morph-inner) punches a hole, leaving only the "stroke".
 * The --morph-delay custom property syncs both animations.
 */
function MorphShape({ delay }: { delay: number }) {
    return (
        <div
            className="morph-shape"
            style={{
                width: `${SHAPE_SIZE}px`,
                height: `${SHAPE_SIZE}px`,
                flexShrink: 0,
                animationDelay: `${delay}s`,
                // Pass delay to ::after via CSS custom property
                ['--morph-delay' as string]: `${delay}s`,
            }}
        />
    );
}
