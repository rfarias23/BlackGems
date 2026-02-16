interface KPISparklineProps {
    data: number[];
    color?: string;
    height?: number;
}

export function KPISparkline({ data, color = '#3E5CFF', height = 32 }: KPISparklineProps) {
    if (data.length === 0) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // Normalize each value to a 0-100% range, with a minimum height of 6% so zero values remain visible
    const bars = data.map((value) => {
        if (range === 0) return 50;
        const normalized = ((value - min) / range) * 100;
        return Math.max(normalized, 6);
    });

    return (
        <div
            className="flex items-end gap-[3px]"
            style={{ height: `${height}px` }}
            aria-label="KPI trend sparkline"
        >
            {bars.map((barHeight, index) => (
                <div
                    key={index}
                    className="rounded-sm"
                    style={{
                        width: '3px',
                        height: `${barHeight}%`,
                        backgroundColor: color,
                        opacity: index === bars.length - 1 ? 1 : 0.5,
                    }}
                />
            ))}
        </div>
    );
}
