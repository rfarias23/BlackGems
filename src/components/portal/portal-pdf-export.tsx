'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateCapitalStatementPDF, CapitalStatementData } from '@/lib/pdf/capital-statement';
import type { LPCapitalStatement } from '@/lib/actions/reports';

interface PortalPDFExportProps {
    statement: LPCapitalStatement;
    fundName: string;
}

export function PortalPDFExport({ statement, fundName }: PortalPDFExportProps) {
    const handleExport = () => {
        const pdfData: CapitalStatementData = {
            fundName,
            investor: statement.investor,
            commitment: statement.commitment,
            performance: statement.performance,
            capitalCalls: statement.capitalCalls,
            distributions: statement.distributions,
        };
        generateCapitalStatementPDF(pdfData);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export PDF
        </Button>
    );
}
