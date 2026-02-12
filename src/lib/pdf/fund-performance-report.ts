import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface FundPerformanceReportData {
    fund: {
        name: string;
        vintage: number;
        targetSize: string;
        status: string;
    };
    capital: {
        totalCommitments: string;
        totalCalled: string;
        totalPaid: string;
        totalDistributed: string;
        unfundedCommitments: string;
        callPercentage: string;
    };
    portfolio: {
        totalCompanies: number;
        activeCompanies: number;
        exitedCompanies: number;
        totalInvested: string;
        totalValue: string;
        realizedValue: string;
        unrealizedValue: string;
    };
    performance: {
        grossMoic: string;
        netMoic: string;
        dpi: string;
        rvpi: string;
        tvpi: string;
        grossIrr: string | null;
        netIrr: string | null;
    };
    dealPipeline: {
        totalDeals: number;
        activeDeals: number;
        wonDeals: number;
        passedDeals: number;
        conversionRate: string;
    };
}

export function generateFundPerformancePDF(data: FundPerformanceReportData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors
    const primaryColor: [number, number, number] = [17, 20, 29]; // #11141D
    const accentColor: [number, number, number] = [62, 92, 255]; // #3E5CFF
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // --- Page 1: Header + Capital + Performance ---

    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Fund name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(data.fund.name, 20, 22);

    // Report title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Fund Performance Report', 20, 33);

    // Meta info
    doc.setFontSize(9);
    doc.text(`Vintage ${data.fund.vintage} · ${data.fund.status} · Target: ${data.fund.targetSize}`, 20, 43);
    doc.text(today, pageWidth - 20, 43, { align: 'right' });

    // --- Capital Summary ---
    let currentY = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Capital Summary', 20, currentY);

    autoTable(doc, {
        startY: currentY + 4,
        head: [['Metric', 'Amount']],
        body: [
            ['Total Commitments', data.capital.totalCommitments],
            ['Capital Called', `${data.capital.totalCalled} (${data.capital.callPercentage})`],
            ['Capital Paid In', data.capital.totalPaid],
            ['Total Distributed', data.capital.totalDistributed],
            ['Unfunded Commitments', data.capital.unfundedCommitments],
        ],
        theme: 'striped',
        headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 80 } },
        margin: { left: 20, right: 20 },
    });

    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    // --- Performance Metrics ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Metrics', 20, currentY);

    autoTable(doc, {
        startY: currentY + 4,
        head: [['Metric', 'Value']],
        body: [
            ['Gross MOIC', data.performance.grossMoic],
            ['Net MOIC', data.performance.netMoic],
            ['DPI (Distributions / Paid-In)', data.performance.dpi],
            ['RVPI (Residual Value / Paid-In)', data.performance.rvpi],
            ['TVPI (Total Value / Paid-In)', data.performance.tvpi],
            ['Gross IRR', data.performance.grossIrr || 'N/A'],
            ['Net IRR', data.performance.netIrr || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 80 } },
        margin: { left: 20, right: 20 },
    });

    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    // --- Portfolio Overview ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Overview', 20, currentY);

    autoTable(doc, {
        startY: currentY + 4,
        head: [['Metric', 'Value']],
        body: [
            ['Total Companies', data.portfolio.totalCompanies.toString()],
            ['Active Companies', data.portfolio.activeCompanies.toString()],
            ['Exited Companies', data.portfolio.exitedCompanies.toString()],
            ['Total Invested', data.portfolio.totalInvested],
            ['Total Value', data.portfolio.totalValue],
            ['Realized Value', data.portfolio.realizedValue],
            ['Unrealized Value', data.portfolio.unrealizedValue],
        ],
        theme: 'striped',
        headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 80 } },
        margin: { left: 20, right: 20 },
    });

    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    // Check if deal pipeline fits on this page
    if (currentY + 60 > pageHeight - 30) {
        addFooter(doc, pageWidth, pageHeight, today, 1);
        doc.addPage();
        currentY = 20;
    }

    // --- Deal Pipeline ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Deal Pipeline', 20, currentY);

    autoTable(doc, {
        startY: currentY + 4,
        head: [['Metric', 'Value']],
        body: [
            ['Total Deals', data.dealPipeline.totalDeals.toString()],
            ['Active Deals', data.dealPipeline.activeDeals.toString()],
            ['Won Deals', data.dealPipeline.wonDeals.toString()],
            ['Passed Deals', data.dealPipeline.passedDeals.toString()],
            ['Conversion Rate', data.dealPipeline.conversionRate],
        ],
        theme: 'striped',
        headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 80 } },
        margin: { left: 20, right: 20 },
    });

    // --- Disclaimer ---
    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

    if (currentY + 30 > pageHeight - 30) {
        addFooter(doc, pageWidth, pageHeight, today, 1);
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text(
        'This report is confidential and intended solely for the use of the fund\'s general partners and authorized personnel.',
        20,
        currentY,
        { maxWidth: pageWidth - 40 }
    );

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, pageWidth, pageHeight, today, i);
    }

    // Download
    const fileName = `${data.fund.name.replace(/\s+/g, '_')}_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, date: string, pageNum: number): void {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated by BlackGem — ${date}`, 20, pageHeight - 12);
    doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 12, { align: 'right' });
}
