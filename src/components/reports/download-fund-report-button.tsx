'use client';

import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { generateFundPerformancePDF, type FundPerformanceReportData } from '@/lib/pdf/fund-performance-report';

interface DownloadFundReportButtonProps {
    data: FundPerformanceReportData;
}

export function DownloadFundReportButton({ data }: DownloadFundReportButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => generateFundPerformancePDF(data)}
            className="text-white border-[#334155] hover:bg-[#334155]"
        >
            <FileDown className="h-4 w-4 mr-2" />
            PDF Report
        </Button>
    );
}
