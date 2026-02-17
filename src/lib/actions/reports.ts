'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { calculateFundIRR, calculateCompanyIRR, calculateLPIRR } from '@/lib/shared/irr'
import { calculateWaterfall, type WaterfallTier } from '@/lib/shared/waterfall'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'


// ============================================================================
// DASHBOARD DATA
// ============================================================================

export interface DashboardData {
    fundName: string
    totalAUM: string
    totalCommitments: string
    capitalCalled: string
    capitalCallPct: string
    activeDeals: number
    totalDeals: number
    investorCount: number
    activeInvestors: number
    grossMoic: string
    netMoic: string
    tvpi: string
    portfolioCompanies: number
    recentDeals: {
        id: string
        name: string
        stage: string
        askingPrice: string | null
    }[]
    recentActivity: {
        id: string
        action: string
        entityType: string
        entityId: string
        userName: string | null
        createdAt: Date
    }[]
}

export async function getDashboardData(): Promise<DashboardData | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { fundId, currency } = fundResult
    const fund = await prisma.fund.findUnique({ where: { id: fundId }, select: { name: true } })
    if (!fund) {
        return null
    }

    // Parallel queries for performance
    const [commitments, portfolioCompanies, deals, investors, recentAuditLogs] = await Promise.all([
        prisma.commitment.findMany({ where: { fundId, ...notDeleted } }),
        prisma.portfolioCompany.findMany({ where: { fundId } }),
        prisma.deal.findMany({
            where: { fundId, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.investor.findMany({ where: { deletedAt: null } }),
        prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
        }),
    ])

    // Capital metrics
    const totalCommitments = commitments.reduce((sum, c) => sum + Number(c.committedAmount), 0)
    const totalCalled = commitments.reduce((sum, c) => sum + Number(c.calledAmount), 0)
    const totalPaid = commitments.reduce((sum, c) => sum + Number(c.paidAmount), 0)
    const totalDistributed = commitments.reduce((sum, c) => sum + Number(c.distributedAmount), 0)

    // Portfolio metrics
    const totalInvested = portfolioCompanies.reduce((sum, c) => sum + Number(c.equityInvested), 0)
    const totalValue = portfolioCompanies.reduce((sum, c) => sum + Number(c.totalValue || 0), 0)
    const unrealizedValue = portfolioCompanies.reduce((sum, c) => sum + Number(c.unrealizedValue || 0), 0)

    const grossMoic = totalInvested > 0 ? totalValue / totalInvested : 0
    const netMoic = grossMoic * 0.85
    const tvpi = totalPaid > 0 ? (totalDistributed + unrealizedValue) / totalPaid : 0

    // Deal metrics
    const activeDeals = deals.filter(d => d.status === 'ACTIVE')

    // Investor metrics
    const activeInvestors = investors.filter(i => i.status === 'ACTIVE' || i.status === 'COMMITTED')

    // Stage display names
    const stageDisplay: Record<string, string> = {
        IDENTIFIED: 'Identified',
        INITIAL_REVIEW: 'Initial Review',
        PRELIMINARY_ANALYSIS: 'Preliminary Analysis',
        MANAGEMENT_MEETING: 'Management Meeting',
        NDA_SIGNED: 'NDA Signed',
        NDA_CIM: 'NDA/CIM',
        IOI_SUBMITTED: 'IOI Submitted',
        SITE_VISIT: 'Site Visit',
        LOI_PREPARATION: 'LOI Preparation',
        LOI_NEGOTIATION: 'LOI Negotiation',
        DUE_DILIGENCE: 'Due Diligence',
        FINAL_NEGOTIATION: 'Final Negotiation',
        CLOSING: 'Closing',
        CLOSED_WON: 'Closed Won',
        CLOSED_LOST: 'Closed Lost',
        CLOSED: 'Closed',
        PASSED: 'Passed',
        ON_HOLD: 'On Hold',
    }

    return {
        fundName: fund.name,
        totalAUM: formatMoney(totalValue || totalCommitments, currency),
        totalCommitments: formatMoney(totalCommitments, currency),
        capitalCalled: formatMoney(totalCalled, currency),
        capitalCallPct: formatPercent(totalCommitments > 0 ? totalCalled / totalCommitments : 0),
        activeDeals: activeDeals.length,
        totalDeals: deals.length,
        investorCount: investors.length,
        activeInvestors: activeInvestors.length,
        grossMoic: formatMultiple(grossMoic),
        netMoic: formatMultiple(netMoic),
        tvpi: formatMultiple(tvpi),
        portfolioCompanies: portfolioCompanies.length,
        recentDeals: deals.slice(0, 5).map(d => ({
            id: d.id,
            name: d.name,
            stage: stageDisplay[d.stage] || d.stage,
            askingPrice: d.askingPrice ? formatMoney(d.askingPrice, currency) : null,
        })),
        recentActivity: recentAuditLogs.map(log => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            userName: log.user?.name || null,
            createdAt: log.createdAt,
        })),
    }
}

// ============================================================================
// FUND PERFORMANCE REPORT
// ============================================================================

export interface FundPerformanceReport {
    fund: {
        id: string
        name: string
        vintage: number
        targetSize: string
        status: string
    }
    capital: {
        totalCommitments: string
        totalCalled: string
        totalPaid: string
        totalDistributed: string
        unfundedCommitments: string
        callPercentage: string
    }
    portfolio: {
        totalCompanies: number
        activeCompanies: number
        exitedCompanies: number
        totalInvested: string
        totalValue: string
        realizedValue: string
        unrealizedValue: string
    }
    performance: {
        grossMoic: string
        netMoic: string
        dpi: string  // Distributions to Paid-In
        rvpi: string // Residual Value to Paid-In
        tvpi: string // Total Value to Paid-In
        grossIrr: string | null
        netIrr: string | null
    }
    waterfall: {
        tiers: WaterfallTier[]
        lpTotal: string
        gpTotal: string
        effectiveCarryPct: string | null
    } | null
    dealPipeline: {
        totalDeals: number
        activeDeals: number
        wonDeals: number
        passedDeals: number
        conversionRate: string
    }
}

export async function getFundPerformanceReport(fundId?: string): Promise<FundPerformanceReport | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    // Get the fund (use active fund if not specified)
    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { fundId: activeFundId, currency } = fundResult
    const resolvedFundId = fundId || activeFundId
    const fund = await prisma.fund.findUnique({ where: { id: resolvedFundId } })

    if (!fund) {
        return null
    }

    // Get commitments
    const commitments = await prisma.commitment.findMany({
        where: { fundId: fund.id, ...notDeleted },
    })

    const totalCommitments = commitments.reduce((sum, c) => sum + Number(c.committedAmount), 0)
    const totalCalled = commitments.reduce((sum, c) => sum + Number(c.calledAmount), 0)
    const totalPaid = commitments.reduce((sum, c) => sum + Number(c.paidAmount), 0)
    const totalDistributed = commitments.reduce((sum, c) => sum + Number(c.distributedAmount), 0)
    const unfundedCommitments = totalCommitments - totalCalled

    // Get portfolio companies
    const portfolioCompanies = await prisma.portfolioCompany.findMany({
        where: { fundId: fund.id },
    })

    const activeCompanies = portfolioCompanies.filter(c => c.status === 'HOLDING' || c.status === 'PREPARING_EXIT' || c.status === 'UNDER_LOI')
    const exitedCompanies = portfolioCompanies.filter(c => c.status === 'EXITED')

    const totalInvested = portfolioCompanies.reduce((sum, c) => sum + Number(c.equityInvested), 0)
    const totalValue = portfolioCompanies.reduce((sum, c) => sum + Number(c.totalValue || 0), 0)
    const realizedValue = portfolioCompanies.reduce((sum, c) => sum + Number(c.realizedValue || 0), 0)
    const unrealizedValue = portfolioCompanies.reduce((sum, c) => sum + Number(c.unrealizedValue || 0), 0)

    // Calculate performance metrics
    const grossMoic = totalInvested > 0 ? totalValue / totalInvested : 0
    const netMoic = grossMoic * 0.85 // Simplified: 85% of gross after fees/carry
    const dpi = totalPaid > 0 ? totalDistributed / totalPaid : 0
    const rvpi = totalPaid > 0 ? unrealizedValue / totalPaid : 0
    const tvpi = totalPaid > 0 ? (totalDistributed + unrealizedValue) / totalPaid : 0

    // Compute IRR from capital call and distribution records
    const [capitalCalls, distributions, deals] = await Promise.all([
        prisma.capitalCall.findMany({
            where: { fundId: fund.id, status: 'FULLY_FUNDED', ...notDeleted },
            select: { callDate: true, totalAmount: true },
        }),
        prisma.distribution.findMany({
            where: { fundId: fund.id, status: 'COMPLETED', ...notDeleted },
            select: { distributionDate: true, totalAmount: true },
        }),
        prisma.deal.findMany({
            where: { fundId: fund.id, ...notDeleted },
        }),
    ])

    const grossIrr = calculateFundIRR({
        capitalCalls: capitalCalls.map(c => ({
            date: c.callDate,
            amount: Number(c.totalAmount),
        })),
        distributions: distributions.map(d => ({
            date: d.distributionDate,
            amount: Number(d.totalAmount),
        })),
        currentNAV: unrealizedValue,
        valuationDate: new Date(),
    })

    // Net IRR: approximate by reducing distributions by management fee impact
    const mgmtFeeRate = Number(fund.managementFee) || 0
    const netIrr = grossIrr !== null
        ? grossIrr * (1 - mgmtFeeRate * 2) // rough approximation
        : null

    // Compute waterfall distribution
    const holdingYears = Math.max(1, (new Date().getFullYear() - fund.vintage))
    let waterfallResult = null
    if (totalDistributed + unrealizedValue > 0) {
        const wf = calculateWaterfall({
            totalDistributable: totalDistributed + unrealizedValue,
            totalContributed: totalPaid,
            hurdleRate: fund.hurdleRate ? Number(fund.hurdleRate) : null,
            carriedInterest: Number(fund.carriedInterest) || 0.20,
            catchUpRate: fund.catchUpRate ? Number(fund.catchUpRate) : null,
            holdingPeriodYears: holdingYears,
            managementFee: mgmtFeeRate,
        })
        waterfallResult = {
            tiers: wf.tiers,
            lpTotal: formatMoney(wf.lpTotal, currency),
            gpTotal: formatMoney(wf.gpTotal, currency),
            effectiveCarryPct: wf.effectiveCarryPct !== null
                ? formatPercent(wf.effectiveCarryPct)
                : null,
        }
    }

    const activeDeals = deals.filter(d => d.status === 'ACTIVE')
    const wonDeals = deals.filter(d => d.status === 'WON')
    const passedDeals = deals.filter(d => d.status === 'PASSED' || d.status === 'LOST')
    const conversionRate = deals.length > 0 ? wonDeals.length / deals.length : 0

    return {
        fund: {
            id: fund.id,
            name: fund.name,
            vintage: fund.vintage,
            targetSize: formatMoney(fund.targetSize, currency),
            status: fund.status,
        },
        capital: {
            totalCommitments: formatMoney(totalCommitments, currency),
            totalCalled: formatMoney(totalCalled, currency),
            totalPaid: formatMoney(totalPaid, currency),
            totalDistributed: formatMoney(totalDistributed, currency),
            unfundedCommitments: formatMoney(unfundedCommitments, currency),
            callPercentage: formatPercent(totalCommitments > 0 ? totalCalled / totalCommitments : 0),
        },
        portfolio: {
            totalCompanies: portfolioCompanies.length,
            activeCompanies: activeCompanies.length,
            exitedCompanies: exitedCompanies.length,
            totalInvested: formatMoney(totalInvested, currency),
            totalValue: formatMoney(totalValue, currency),
            realizedValue: formatMoney(realizedValue, currency),
            unrealizedValue: formatMoney(unrealizedValue, currency),
        },
        performance: {
            grossMoic: formatMultiple(grossMoic),
            netMoic: formatMultiple(netMoic),
            dpi: formatMultiple(dpi),
            rvpi: formatMultiple(rvpi),
            tvpi: formatMultiple(tvpi),
            grossIrr: grossIrr !== null ? formatPercent(grossIrr) : null,
            netIrr: netIrr !== null ? formatPercent(netIrr) : null,
        },
        waterfall: waterfallResult,
        dealPipeline: {
            totalDeals: deals.length,
            activeDeals: activeDeals.length,
            wonDeals: wonDeals.length,
            passedDeals: passedDeals.length,
            conversionRate: formatPercent(conversionRate),
        },
    }
}

// ============================================================================
// LP CAPITAL ACCOUNT STATEMENT
// ============================================================================

export interface LPCapitalStatement {
    investor: {
        id: string
        name: string
        type: string
    }
    commitment: {
        committedAmount: string
        calledAmount: string
        paidAmount: string
        distributedAmount: string
        unfundedAmount: string
        ownershipPct: string
    }
    performance: {
        netContributions: string
        totalValue: string
        moic: string
        irr: string | null
    }
    capitalCalls: {
        id: string
        callNumber: number
        callDate: Date
        amount: string
        paidAmount: string
        status: string
    }[]
    distributions: {
        id: string
        distributionNumber: number
        date: Date
        grossAmount: string
        netAmount: string
        type: string
        status: string
    }[]
}

export async function getLPCapitalStatement(investorId: string, fundId?: string): Promise<LPCapitalStatement | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const investor = await prisma.investor.findUnique({
        where: { id: investorId },
    })

    if (!investor) {
        return null
    }

    // Get the fund
    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { fundId: activeFundId, currency } = fundResult
    const resolvedFundId = fundId || activeFundId

    // Get commitment
    const commitment = await prisma.commitment.findFirst({
        where: {
            investorId: investorId,
            fundId: resolvedFundId,
            ...notDeleted,
        },
    })

    if (!commitment) {
        return null
    }

    // Get all commitments to calculate ownership %
    const allCommitments = await prisma.commitment.findMany({
        where: { fundId: resolvedFundId, ...notDeleted },
    })
    const totalCommitted = allCommitments.reduce((sum, c) => sum + Number(c.committedAmount), 0)
    const ownershipPct = totalCommitted > 0 ? Number(commitment.committedAmount) / totalCommitted : 0

    // Get capital call items
    const capitalCallItems = await prisma.capitalCallItem.findMany({
    where: {
        investorId: investorId,
        capitalCall: {
            fundId: resolvedFundId
        }
    },
    include: {
        capitalCall: true,
    },
    orderBy: { capitalCall: { callDate: 'desc' } },
    })

    // Get distribution items
    const distributionItems = await prisma.distributionItem.findMany({
    where: {
        investorId: investorId,
        distribution: {
            fundId: resolvedFundId
        }
    },
    include: {
        distribution: true,
    },
    orderBy: { distribution: { distributionDate: 'desc' } },
    })

    const netContributions = Number(commitment.paidAmount) - Number(commitment.distributedAmount)
    const estimatedValue = Number(commitment.paidAmount) * 1.1 // Simplified: 10% gain estimate
    const moic = Number(commitment.paidAmount) > 0
        ? (Number(commitment.distributedAmount) + estimatedValue) / Number(commitment.paidAmount)
        : 1

    // Calculate LP-level IRR from their capital call and distribution items
    const lpIrr = calculateLPIRR({
        capitalCalls: capitalCallItems
            .filter(item => item.capitalCall && item.status === 'PAID')
            .map(item => ({
                date: item.capitalCall!.callDate,
                amount: Number(item.paidAmount),
            })),
        distributions: distributionItems
            .filter(item => item.distribution && item.status === 'PAID')
            .map(item => ({
                date: item.distribution!.distributionDate,
                amount: Number(item.netAmount),
            })),
        currentNAV: estimatedValue,
        valuationDate: new Date(),
    })

    return {
        investor: {
            id: investor.id,
            name: investor.name,
            type: investor.type,
        },
        commitment: {
            committedAmount: formatMoney(commitment.committedAmount, currency),
            calledAmount: formatMoney(commitment.calledAmount, currency),
            paidAmount: formatMoney(commitment.paidAmount, currency),
            distributedAmount: formatMoney(commitment.distributedAmount, currency),
            unfundedAmount: formatMoney(Number(commitment.committedAmount) - Number(commitment.calledAmount), currency),
            ownershipPct: formatPercent(ownershipPct),
        },
        performance: {
            netContributions: formatMoney(netContributions, currency),
            totalValue: formatMoney(estimatedValue + Number(commitment.distributedAmount), currency),
            moic: formatMultiple(moic),
            irr: lpIrr !== null ? formatPercent(lpIrr) : null,
        },
        capitalCalls: capitalCallItems
            .filter(item => item.capitalCall)
            .map(item => ({
                id: item.id,
                callNumber: item.capitalCall!.callNumber,
                callDate: item.capitalCall!.callDate,
                amount: formatMoney(item.callAmount, currency),
                paidAmount: formatMoney(item.paidAmount, currency),
                status: item.status,
            })),
        distributions: distributionItems
            .filter(item => item.distribution)
            .map(item => ({
                id: item.id,
                distributionNumber: item.distribution!.distributionNumber,
                date: item.distribution!.distributionDate,
                grossAmount: formatMoney(item.grossAmount, currency),
                netAmount: formatMoney(item.netAmount, currency),
                type: item.distribution!.type,
                status: item.status,
            })),
    }
}

// ============================================================================
// PORTFOLIO SUMMARY REPORT
// ============================================================================

export interface PortfolioSummaryReport {
    summary: {
        totalCompanies: number
        totalInvested: string
        totalValue: string
        portfolioMoic: string
        avgHoldingPeriod: string
    }
    companies: {
        id: string
        name: string
        industry: string | null
        acquisitionDate: Date
        holdingPeriodMonths: number
        invested: string
        currentValue: string
        moic: string
        irr: string | null
        status: string
    }[]
    byIndustry: {
        industry: string
        count: number
        invested: string
        value: string
    }[]
    byStatus: {
        status: string
        count: number
        invested: string
        value: string
    }[]
}

export async function getPortfolioSummaryReport(fundId?: string): Promise<PortfolioSummaryReport | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { fundId: activeFundId, currency } = fundResult
    const resolvedFundId = fundId || activeFundId
    const whereClause = { fundId: resolvedFundId }

    const companies = await prisma.portfolioCompany.findMany({
        where: whereClause,
        orderBy: { acquisitionDate: 'desc' },
    })

    if (companies.length === 0) {
        return {
            summary: {
                totalCompanies: 0,
                totalInvested: formatMoney(0, currency),
                totalValue: formatMoney(0, currency),
                portfolioMoic: '0.00x',
                avgHoldingPeriod: '0 months',
            },
            companies: [],
            byIndustry: [],
            byStatus: [],
        }
    }

    const totalInvested = companies.reduce((sum, c) => sum + Number(c.equityInvested), 0)
    const totalValue = companies.reduce((sum, c) => sum + Number(c.totalValue || c.equityInvested), 0)
    const portfolioMoic = totalInvested > 0 ? totalValue / totalInvested : 0

    // Calculate holding periods
    const now = new Date()
    const holdingPeriods = companies.map(c => {
        const months = (now.getFullYear() - c.acquisitionDate.getFullYear()) * 12 +
            (now.getMonth() - c.acquisitionDate.getMonth())
        return Math.max(1, months)
    })
    const avgHoldingPeriod = holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length

    // Group by industry
    const industryMap = new Map<string, { count: number; invested: number; value: number }>()
    companies.forEach(c => {
        const industry = c.industry || 'Other'
        const current = industryMap.get(industry) || { count: 0, invested: 0, value: 0 }
        industryMap.set(industry, {
            count: current.count + 1,
            invested: current.invested + Number(c.equityInvested),
            value: current.value + Number(c.totalValue || c.equityInvested),
        })
    })

    // Group by status
    const statusMap = new Map<string, { count: number; invested: number; value: number }>()
    companies.forEach(c => {
        const status = c.status
        const current = statusMap.get(status) || { count: 0, invested: 0, value: 0 }
        statusMap.set(status, {
            count: current.count + 1,
            invested: current.invested + Number(c.equityInvested),
            value: current.value + Number(c.totalValue || c.equityInvested),
        })
    })

    const statusDisplay: Record<string, string> = {
        HOLDING: 'Holding',
        PREPARING_EXIT: 'Preparing Exit',
        UNDER_LOI: 'Under LOI',
        PARTIAL_EXIT: 'Partial Exit',
        EXITED: 'Exited',
        WRITTEN_OFF: 'Written Off',
    }

    return {
        summary: {
            totalCompanies: companies.length,
            totalInvested: formatMoney(totalInvested, currency),
            totalValue: formatMoney(totalValue, currency),
            portfolioMoic: formatMultiple(portfolioMoic),
            avgHoldingPeriod: `${Math.round(avgHoldingPeriod)} months`,
        },
        companies: companies.map((c, index) => {
            const companyIrr = calculateCompanyIRR(
                c.acquisitionDate,
                Number(c.equityInvested),
                Number(c.totalValue || c.equityInvested),
                c.exitDate || new Date()
            )
            return {
                id: c.id,
                name: c.name,
                industry: c.industry,
                acquisitionDate: c.acquisitionDate,
                holdingPeriodMonths: holdingPeriods[index],
                invested: formatMoney(c.equityInvested, currency),
                currentValue: formatMoney(c.totalValue || c.equityInvested, currency),
                moic: formatMultiple(c.moic || 1),
                irr: companyIrr !== null ? formatPercent(companyIrr) : null,
                status: statusDisplay[c.status] || c.status,
            }
        }),
        byIndustry: Array.from(industryMap.entries()).map(([industry, data]) => ({
            industry,
            count: data.count,
            invested: formatMoney(data.invested, currency),
            value: formatMoney(data.value, currency),
        })),
        byStatus: Array.from(statusMap.entries()).map(([status, data]) => ({
            status: statusDisplay[status] || status,
            count: data.count,
            invested: formatMoney(data.invested, currency),
            value: formatMoney(data.value, currency),
        })),
    }
}

// ============================================================================
// DEAL PIPELINE REPORT
// ============================================================================

export interface DealPipelineReport {
    summary: {
        totalDeals: number
        activeDeals: number
        avgDealSize: string
        conversionRate: string
    }
    byStage: {
        stage: string
        count: number
        totalValue: string
    }[]
    recentActivity: {
        id: string
        name: string
        stage: string
        askingPrice: string | null
        lastUpdated: Date
    }[]
}

export async function getDealPipelineReport(fundId?: string): Promise<DealPipelineReport | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { fundId: activeFundId, currency } = fundResult
    const resolvedFundId = fundId || activeFundId
    const whereClause = { fundId: resolvedFundId }

    const deals = await prisma.deal.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
    })

    const activeDeals = deals.filter(d => d.status === 'ACTIVE')
    const wonDeals = deals.filter(d => d.status === 'WON')
    const totalValue = deals.reduce((sum, d) => sum + Number(d.askingPrice || 0), 0)
    const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0
    const conversionRate = deals.length > 0 ? wonDeals.length / deals.length : 0

    // Group by stage
    const stageMap = new Map<string, { count: number; value: number }>()
    deals.forEach(d => {
        const stage = d.stage
        const current = stageMap.get(stage) || { count: 0, value: 0 }
        stageMap.set(stage, {
            count: current.count + 1,
            value: current.value + Number(d.askingPrice || 0),
        })
    })

    const stageDisplay: Record<string, string> = {
        IDENTIFIED: 'Identified',
        INITIAL_REVIEW: 'Initial Review',
        PRELIMINARY_ANALYSIS: 'Preliminary Analysis',
        MANAGEMENT_MEETING: 'Management Meeting',
        NDA_SIGNED: 'NDA Signed',
        NDA_CIM: 'NDA/CIM',
        IOI_SUBMITTED: 'IOI Submitted',
        SITE_VISIT: 'Site Visit',
        LOI_PREPARATION: 'LOI Preparation',
        LOI_NEGOTIATION: 'LOI Negotiation',
        DUE_DILIGENCE: 'Due Diligence',
        FINAL_NEGOTIATION: 'Final Negotiation',
        CLOSING: 'Closing',
        CLOSED_WON: 'Closed Won',
        CLOSED_LOST: 'Closed Lost',
        CLOSED: 'Closed',
        PASSED: 'Passed',
        ON_HOLD: 'On Hold',
    }

    return {
        summary: {
            totalDeals: deals.length,
            activeDeals: activeDeals.length,
            avgDealSize: formatMoney(avgDealSize, currency),
            conversionRate: formatPercent(conversionRate),
        },
        byStage: Array.from(stageMap.entries())
            .map(([stage, data]) => ({
                stage: stageDisplay[stage] || stage,
                count: data.count,
                totalValue: formatMoney(data.value, currency),
            }))
            .sort((a, b) => b.count - a.count),
        recentActivity: deals.slice(0, 10).map(d => ({
            id: d.id,
            name: d.name,
            stage: stageDisplay[d.stage] || d.stage,
            askingPrice: d.askingPrice ? formatMoney(d.askingPrice, currency) : null,
            lastUpdated: d.updatedAt,
        })),
    }
}

// ============================================================================
// GET ALL INVESTORS FOR LP STATEMENTS
// ============================================================================

export async function getInvestorsForReports(): Promise<{ id: string; name: string; type: string }[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const investors = await prisma.investor.findMany({
        where: {
            commitments: {
                some: {},
            },
        },
        select: {
            id: true,
            name: true,
            type: true,
        },
        orderBy: { name: 'asc' },
    })

    return investors
}

// ============================================================================
// GET ALL FUNDS FOR REPORTS
// ============================================================================

export async function getFundsForReports(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const funds = await prisma.fund.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    })

    return funds
}
