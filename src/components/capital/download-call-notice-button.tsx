'use client';

import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { generateCapitalCallPDF, CapitalCallNoticeData } from '@/lib/pdf/capital-call-notice';

interface DownloadCallNoticeButtonProps {
    data: CapitalCallNoticeData;
}

export function DownloadCallNoticeButton({ data }: DownloadCallNoticeButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => generateCapitalCallPDF(data)}
            className="border-[#334155] text-[#F8FAFC] hover:bg-[#334155]"
        >
            <FileDown className="mr-2 h-4 w-4" />
            PDF Notice
        </Button>
    );
}
