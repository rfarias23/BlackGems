'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { generateDashboardPDF, DashboardMetrics } from '@/lib/pdf/dashboard-report';

interface DownloadReportButtonProps {
    metrics: DashboardMetrics;
}

export function DownloadReportButton({ metrics }: DownloadReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            // Small delay to show loading state
            await new Promise((resolve) => setTimeout(resolve, 100));
            generateDashboardPDF(metrics);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </>
            )}
        </Button>
    );
}
