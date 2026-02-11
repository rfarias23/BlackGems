'use client';

/**
 * ChainPattern — Decorative background pattern of connected circles
 * Inspired by the BlackGem .pen design: rows of ellipses connected by thin lines,
 * rotated -90° and stacked at low opacity to create a subtle molecular/network texture.
 */
export function ChainPattern() {
    // Pattern data from the .pen file: each row has a specific sequence
    // of circle-pairs and connecting lines of varying heights
    const rowPattern = [
        { circles: 2, lineH: 40 },
        { circles: 2, lineH: 50 },
        { circles: 1, lineH: 60 },
        { circles: 2, lineH: 50 },
        { circles: 2, lineH: 40 },
        { circles: 2, lineH: 0 },
        { circles: 1, lineH: 50 },
        { circles: 2, lineH: 40 },
        { circles: 2, lineH: 60 },
        { circles: 1, lineH: 0 },
    ];

    // Build an SVG row as a horizontal chain
    const buildRow = (rowIndex: number, yOffset: number) => {
        const items: React.ReactNode[] = [];
        let xCursor = 0;

        for (let s = 0; s < rowPattern.length; s++) {
            const seg = rowPattern[s];

            for (let c = 0; c < seg.circles; c++) {
                items.push(
                    <circle
                        key={`r${rowIndex}-s${s}-c${c}`}
                        cx={xCursor + 25}
                        cy={yOffset + 30}
                        r={25}
                        fill="none"
                        stroke="white"
                        strokeWidth={1.5}
                    />
                );
                xCursor += 58;
            }

            if (seg.lineH > 0) {
                // Horizontal connector line
                items.push(
                    <rect
                        key={`r${rowIndex}-s${s}-line`}
                        x={xCursor}
                        y={yOffset + 29}
                        width={seg.lineH}
                        height={2}
                        fill="white"
                    />
                );
                xCursor += seg.lineH + 8;
            }
        }

        return items;
    };

    const rows = 8;
    const rowSpacing = 88;

    return (
        <svg
            className="absolute top-0 left-0 bottom-0 right-[300px] h-full"
            viewBox={`0 0 1100 ${rows * rowSpacing}`}
            preserveAspectRatio="xMinYMid slice"
            aria-hidden="true"
        >
            {Array.from({ length: rows }, (_, i) => (
                <g key={i}>
                    {buildRow(i, i * rowSpacing)}
                </g>
            ))}
        </svg>
    );
}
