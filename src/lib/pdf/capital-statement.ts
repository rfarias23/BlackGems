import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CapitalStatementData {
    fundName: string;
    investor: {
        name: string;
        type: string;
    };
    commitment: {
        committedAmount: string;
        calledAmount: string;
        paidAmount: string;
        distributedAmount: string;
        unfundedAmount: string;
        ownershipPct: string;
    };
    performance: {
        netContributions: string;
        totalValue: string;
        moic: string;
        irr: string | null;
    };
    capitalCalls: Array<{
        callNumber: number;
        callDate: Date;
        amount: string;
        paidAmount: string;
        status: string;
    }>;
    distributions: Array<{
        distributionNumber: number;
        date: Date;
        grossAmount: string;
        netAmount: string;
        type: string;
        status: string;
    }>;
}

function fmtDate(d: Date): string {
    return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function generateCapitalStatementPDF(data: CapitalStatementData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const primaryColor: [number, number, number] = [17, 20, 29];
    const accentColor: [number, number, number] = [62, 92, 255];

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(data.fundName, 20, 22);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Capital Account Statement', 20, 35);

    doc.setFontSize(11);
    doc.text(data.investor.name, 20, 47);

    doc.setFontSize(10);
    doc.text(`As of ${today}`, pageWidth - 20, 35, { align: 'right' });
    doc.text(data.investor.type, pageWidth - 20, 47, { align: 'right' });

    // Capital Account Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Capital Account Summary', 20, 72);

    autoTable(doc, {
        startY: 77,
        head: [['Metric', 'Amount']],
        body: [
            ['Total Commitment', data.commitment.committedAmount],
            ['Capital Called', data.commitment.calledAmount],
            ['Capital Paid', data.commitment.paidAmount],
            ['Distributions Received', data.commitment.distributedAmount],
            ['Unfunded Commitment', data.commitment.unfundedAmount],
            ['Ownership Percentage', data.commitment.ownershipPct],
        ],
        theme: 'plain',
        headStyles: {
            fillColor: accentColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        styles: { fontSize: 11, cellPadding: 6 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
        },
        margin: { left: 20, right: 20 },
    });

    let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

    // Performance Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance', 20, y + 15);

    autoTable(doc, {
        startY: y + 20,
        head: [['Metric', 'Value']],
        body: [
            ['Net Contributions', data.performance.netContributions],
            ['Total Value (NAV)', data.performance.totalValue],
            ['MOIC', `${data.performance.moic}x`],
            ['IRR', data.performance.irr || 'N/A'],
        ],
        theme: 'plain',
        headStyles: {
            fillColor: accentColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        styles: { fontSize: 11, cellPadding: 6 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
        },
        margin: { left: 20, right: 20 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 200;

    // Capital Calls History
    if (data.capitalCalls.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Capital Call History', 20, y + 15);

        autoTable(doc, {
            startY: y + 20,
            head: [['Call #', 'Date', 'Amount', 'Paid', 'Status']],
            body: data.capitalCalls.map((c) => [
                `#${c.callNumber}`,
                fmtDate(c.callDate),
                c.amount,
                c.paidAmount,
                c.status,
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: accentColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: { fontSize: 10, cellPadding: 5 },
            margin: { left: 20, right: 20 },
        });

        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y + 50;
    }

    // Distributions History
    if (data.distributions.length > 0) {
        // Check if we need a new page
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Distribution History', 20, y + 15);

        autoTable(doc, {
            startY: y + 20,
            head: [['Dist #', 'Date', 'Gross', 'Net', 'Type', 'Status']],
            body: data.distributions.map((d) => [
                `#${d.distributionNumber}`,
                fmtDate(d.date),
                d.grossAmount,
                d.netAmount,
                d.type,
                d.status,
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: accentColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: { fontSize: 10, cellPadding: 5 },
            margin: { left: 20, right: 20 },
        });
    }

    // Footer (on every page)
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Generated by BlackGem - ${today}  |  Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    const fileName = `${data.fundName.replace(/\s+/g, '_')}_${data.investor.name.replace(/\s+/g, '_')}_Capital_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}
