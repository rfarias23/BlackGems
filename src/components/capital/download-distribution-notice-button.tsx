'use client';

import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { generateDistributionPDF, DistributionNoticeData } from '@/lib/pdf/distribution-notice';

interface DownloadDistributionNoticeButtonProps {
    data: DistributionNoticeData;
}

export function DownloadDistributionNoticeButton({ data }: DownloadDistributionNoticeButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => generateDistributionPDF(data)}
            className="border-[#334155] text-[#F8FAFC] hover:bg-[#334155]"
        >
            <FileDown className="mr-2 h-4 w-4" />
            PDF Notice
        </Button>
    );
}
