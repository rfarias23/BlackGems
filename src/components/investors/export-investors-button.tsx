'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCSV, type CSVColumn } from '@/lib/csv/export';

interface InvestorExportData {
    name: string;
    type: string;
    status: string;
    email: string;
    contactName: string;
    contactEmail: string;
    totalCommitted: string;
    totalCalled: string;
    totalPaid: string;
    createdAt: string;
}

interface ExportInvestorsButtonProps {
    data: InvestorExportData[];
}

export function ExportInvestorsButton({ data }: ExportInvestorsButtonProps) {
    const columns: CSVColumn<InvestorExportData>[] = [
        { header: 'Investor Name', accessor: 'name' },
        { header: 'Type', accessor: 'type' },
        { header: 'Status', accessor: 'status' },
        { header: 'Email', accessor: 'email' },
        { header: 'Contact Name', accessor: 'contactName' },
        { header: 'Contact Email', accessor: 'contactEmail' },
        { header: 'Total Committed', accessor: 'totalCommitted' },
        { header: 'Total Called', accessor: 'totalCalled' },
        { header: 'Total Paid', accessor: 'totalPaid' },
        { header: 'Date Added', accessor: 'createdAt' },
    ];

    return (
        <Button
            variant="outline"
            size="sm"
            className="text-white border-[#334155] hover:bg-[#334155]"
            onClick={() =>
                exportToCSV(
                    `investors-${new Date().toISOString().slice(0, 10)}`,
                    columns,
                    data
                )
            }
        >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
        </Button>
    );
}
