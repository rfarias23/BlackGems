import { PrismaClient, UserRole, FundType, FundStatus, Currency, DealStage, DealStatus, InvestorType, InvestorStatus, AccreditedStatus, KYCStatus, AMLStatus, CommitmentStatus, CapitalCallStatus, CallItemStatus, DistributionType, DistributionStatus, DistItemStatus, PortfolioStatus, MetricPeriodType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
})

async function main() {
    console.log('[SEED] Starting seed...')
    console.log('[SEED] Connecting to database...')
    await prisma.$connect()
    console.log('[SEED] Connected!')

    console.log('[SEED] Hashing password...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    console.log('[SEED] Password hashed')

    // Create admin user
    console.log('[SEED] Creating admin user...')
    const user = await prisma.user.upsert({
        where: { email: 'admin@blackgem.com' },
        update: {},
        create: {
            email: 'admin@blackgem.com',
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: UserRole.FUND_ADMIN,
        },
    })
    console.log('User created:', user.email)

    // Create LP user (for portal access)
    console.log('[SEED] Creating LP user...')
    const lpUser = await prisma.user.upsert({
        where: { email: 'lp@blackgem.com' },
        update: {},
        create: {
            email: 'lp@blackgem.com',
            name: 'Robert Smith',
            passwordHash: hashedPassword,
            role: UserRole.LP_PRIMARY,
        },
    })
    console.log('LP User created:', lpUser.email)

    // Create a default fund
    console.log('[SEED] Creating fund...')
    const fund = await prisma.fund.upsert({
        where: { slug: 'blackgem-fund-i' },
        update: {},
        create: {
            name: 'BlackGem Fund I',
            slug: 'blackgem-fund-i',
            legalName: 'BlackGem Capital Partners I, LP',
            type: FundType.PE_FUND,
            status: FundStatus.SEARCHING,
            vintage: 2026,
            targetSize: 50000000, // $50M
            hardCap: 75000000, // $75M
            minimumCommitment: 250000, // $250K
            currency: Currency.USD,
            managementFee: 0.02, // 2%
            carriedInterest: 0.20, // 20%
            hurdleRate: 0.08, // 8%
            description: 'BlackGem Fund I focuses on acquiring and growing profitable SMBs in the manufacturing and business services sectors.',
        },
    })
    console.log('Fund created:', fund.name)

    // Create FundMember linking admin user to the fund
    console.log('[SEED] Creating fund member...')
    const existingMember = await prisma.fundMember.findUnique({
        where: { fundId_userId: { fundId: fund.id, userId: user.id } },
    })
    if (!existingMember) {
        await prisma.fundMember.create({
            data: {
                fundId: fund.id,
                userId: user.id,
                role: 'PRINCIPAL',
                permissions: ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
                isActive: true,
            },
        })
        console.log('FundMember created for:', user.email)
    } else {
        console.log('FundMember already exists for:', user.email)
    }

    // Create sample deals
    console.log('[SEED] Creating deals...')
    const deals = [
        {
            name: 'ABC Manufacturing',
            companyName: 'ABC Manufacturing Co.',
            stage: DealStage.DUE_DILIGENCE,
            status: DealStatus.ACTIVE,
            industry: 'Manufacturing',
            askingPrice: 8500000,
            revenue: 8200000,
            ebitda: 1400000,
            ebitdaMargin: 0.1707, // 1,400,000 / 8,200,000
            description: 'ABC Manufacturing is a 35-year-old manufacturer of industrial equipment with strong customer relationships and consistent margins.',
            city: 'Detroit',
            state: 'MI',
            country: 'USA',
            employeeCount: 45,
            yearFounded: 1991,
            firstContactDate: new Date('2025-10-15'),
            ndaSignedDate: new Date('2025-11-01'),
            cimReceivedDate: new Date('2025-11-08'),
            managementMeetingDate: new Date('2025-12-03'),
            loiSubmittedDate: new Date('2025-12-20'),
            loiAcceptedDate: new Date('2026-01-05'),
            expectedCloseDate: new Date('2026-03-31'),
        },
        {
            name: 'TechFlow Solutions',
            companyName: 'TechFlow Solutions Inc.',
            stage: DealStage.LOI_NEGOTIATION,
            status: DealStatus.ACTIVE,
            industry: 'Software',
            askingPrice: 4200000,
            revenue: 3100000,
            ebitda: 850000,
            ebitdaMargin: 0.2742, // 850,000 / 3,100,000
            description: 'B2B SaaS platform for workflow automation with strong recurring revenue.',
            city: 'Austin',
            state: 'TX',
            country: 'USA',
            employeeCount: 22,
            yearFounded: 2018,
            firstContactDate: new Date('2025-11-20'),
            ndaSignedDate: new Date('2025-12-05'),
            cimReceivedDate: new Date('2025-12-12'),
            managementMeetingDate: new Date('2026-01-10'),
            expectedCloseDate: new Date('2026-04-30'),
        },
        {
            name: 'GreenLeaf Logistics',
            companyName: 'GreenLeaf Logistics LLC',
            stage: DealStage.INITIAL_REVIEW,
            status: DealStatus.ACTIVE,
            industry: 'Logistics',
            askingPrice: 12000000,
            revenue: 15000000,
            ebitda: 2100000,
            ebitdaMargin: 0.14, // 2,100,000 / 15,000,000
            description: 'Regional logistics provider with fleet of 50+ trucks serving the Midwest.',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            employeeCount: 85,
            yearFounded: 2005,
            firstContactDate: new Date('2026-01-10'),
        },
        {
            name: 'Summit Healthcare',
            companyName: 'Summit Healthcare Services',
            stage: DealStage.IDENTIFIED,
            status: DealStatus.ACTIVE,
            industry: 'Healthcare',
            askingPrice: null,
            revenue: 6500000,
            ebitda: 1100000,
            ebitdaMargin: 0.1692, // 1,100,000 / 6,500,000
            description: 'Home healthcare services provider with multiple locations.',
            city: 'Denver',
            state: 'CO',
            country: 'USA',
            employeeCount: 120,
            yearFounded: 2012,
        },
        {
            name: 'Apex Construction',
            companyName: 'Apex Construction Group',
            stage: DealStage.CLOSED_LOST,
            status: DealStatus.LOST,
            industry: 'Construction',
            askingPrice: 6000000,
            revenue: 9200000,
            ebitda: 920000,
            ebitdaMargin: 0.10, // 920,000 / 9,200,000
            description: 'Commercial construction company specializing in tenant improvements.',
            city: 'Phoenix',
            state: 'AZ',
            country: 'USA',
            employeeCount: 38,
            yearFounded: 2008,
            firstContactDate: new Date('2025-08-01'),
            ndaSignedDate: new Date('2025-08-20'),
            cimReceivedDate: new Date('2025-09-01'),
            managementMeetingDate: new Date('2025-09-25'),
        },
    ]

    for (const dealData of deals) {
        const existingDeal = await prisma.deal.findFirst({
            where: { name: dealData.name, fundId: fund.id },
        })

        if (!existingDeal) {
            const deal = await prisma.deal.create({
                data: {
                    ...dealData,
                    fundId: fund.id,
                },
            })
            console.log('Deal created:', deal.name)
        } else {
            console.log('Deal already exists:', dealData.name)
        }
    }

    // Create sample investors
    console.log('[SEED] Creating investors...')
    const investors = [
        {
            name: 'Smith Family Office',
            type: InvestorType.FAMILY_OFFICE,
            status: InvestorStatus.ACTIVE,
            email: 'investments@smithfo.com',
            contactName: 'Robert Smith',
            contactEmail: 'robert@smithfo.com',
            contactPhone: '+1 (212) 555-0101',
            contactTitle: 'Chief Investment Officer',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            accreditedStatus: AccreditedStatus.QUALIFIED_PURCHASER,
            kycStatus: KYCStatus.APPROVED,
            amlStatus: AMLStatus.CLEARED,
            investmentCapacity: 25000000,
            notes: 'Long-term relationship, interested in manufacturing deals.',
        },
        {
            name: 'Midwest Pension Trust',
            type: InvestorType.PENSION,
            status: InvestorStatus.ACTIVE,
            email: 'alternatives@midwestpension.org',
            contactName: 'Sarah Johnson',
            contactEmail: 'sjohnson@midwestpension.org',
            contactPhone: '+1 (312) 555-0202',
            contactTitle: 'Director of Alternative Investments',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            accreditedStatus: AccreditedStatus.INSTITUTIONAL,
            kycStatus: KYCStatus.APPROVED,
            amlStatus: AMLStatus.CLEARED,
            investmentCapacity: 100000000,
            notes: 'Institutional investor with strict ESG requirements.',
        },
        {
            name: 'John Anderson',
            type: InvestorType.INDIVIDUAL,
            status: InvestorStatus.COMMITTED,
            email: 'john.anderson@email.com',
            contactName: 'John Anderson',
            contactEmail: 'john.anderson@email.com',
            contactPhone: '+1 (415) 555-0303',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            accreditedStatus: AccreditedStatus.ACCREDITED_INDIVIDUAL,
            kycStatus: KYCStatus.APPROVED,
            amlStatus: AMLStatus.CLEARED,
            investmentCapacity: 2000000,
            notes: 'Former tech executive, interested in software deals.',
        },
        {
            name: 'Harbor Foundation',
            type: InvestorType.FOUNDATION,
            status: InvestorStatus.INTERESTED,
            email: 'investments@harborfdn.org',
            contactName: 'Michael Chen',
            contactEmail: 'mchen@harborfdn.org',
            contactPhone: '+1 (617) 555-0404',
            contactTitle: 'Investment Committee Chair',
            city: 'Boston',
            state: 'MA',
            country: 'USA',
            accreditedStatus: AccreditedStatus.INSTITUTIONAL,
            kycStatus: KYCStatus.IN_PROGRESS,
            amlStatus: AMLStatus.PENDING,
            investmentCapacity: 15000000,
            notes: 'Mission-driven, looking for impact investments.',
        },
        {
            name: 'Williams Trust',
            type: InvestorType.TRUST,
            status: InvestorStatus.PROSPECT,
            email: 'trustee@williamstrust.com',
            contactName: 'Elizabeth Williams',
            contactEmail: 'elizabeth@williamstrust.com',
            contactPhone: '+1 (305) 555-0505',
            city: 'Miami',
            state: 'FL',
            country: 'USA',
            accreditedStatus: AccreditedStatus.QUALIFIED_PURCHASER,
            kycStatus: KYCStatus.PENDING,
            amlStatus: AMLStatus.PENDING,
            investmentCapacity: 5000000,
            notes: 'Referred by Smith Family Office.',
        },
    ]

    for (const investorData of investors) {
        const existingInvestor = await prisma.investor.findFirst({
            where: { name: investorData.name },
        })

        if (!existingInvestor) {
            const investor = await prisma.investor.create({
                data: investorData,
            })
            console.log('Investor created:', investor.name)

            // Create commitment for active investors
            if (investorData.status === InvestorStatus.ACTIVE || investorData.status === InvestorStatus.COMMITTED) {
                const commitmentAmount = investorData.name === 'Smith Family Office' ? 5000000 :
                                        investorData.name === 'Midwest Pension Trust' ? 10000000 :
                                        investorData.name === 'John Anderson' ? 500000 : 0

                if (commitmentAmount > 0) {
                    await prisma.commitment.create({
                        data: {
                            investorId: investor.id,
                            fundId: fund.id,
                            committedAmount: commitmentAmount,
                            calledAmount: commitmentAmount * 0.3, // 30% called
                            paidAmount: commitmentAmount * 0.3,
                            status: CommitmentStatus.ACTIVE,
                            commitmentDate: new Date('2026-01-15'),
                            effectiveDate: new Date('2026-01-20'),
                            subscriptionDocsSigned: true,
                            subscriptionDocsDate: new Date('2026-01-18'),
                        },
                    })
                    console.log('Commitment created for:', investor.name)
                }
            }

            // Create PENDING commitment for investors without one
            if (investorData.status !== InvestorStatus.ACTIVE && investorData.status !== InvestorStatus.COMMITTED) {
                await prisma.commitment.create({
                    data: {
                        investorId: investor.id,
                        fundId: fund.id,
                        committedAmount: 0,
                        calledAmount: 0,
                        paidAmount: 0,
                        distributedAmount: 0,
                        status: CommitmentStatus.PENDING,
                    },
                })
                console.log('PENDING Commitment created for:', investor.name)
            }
        } else {
            console.log('Investor already exists:', investorData.name)
        }
    }

    // Link LP user to Smith Family Office investor
    console.log('[SEED] Linking LP user to Smith Family Office...')
    const smithInvestor = await prisma.investor.findFirst({
        where: { name: 'Smith Family Office' },
    })
    if (smithInvestor && !smithInvestor.userId) {
        await prisma.investor.update({
            where: { id: smithInvestor.id },
            data: { userId: lpUser.id },
        })
        console.log('LP user linked to:', smithInvestor.name)
    }

    // Create sample capital calls
    console.log('[SEED] Creating capital calls...')
    const existingCall = await prisma.capitalCall.findFirst({
        where: { fundId: fund.id, callNumber: 1 },
    })

    if (!existingCall) {
        // Get all active commitments
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: fund.id,
                status: { in: ['ACTIVE', 'FUNDED', 'SIGNED'] },
            },
        })

        const totalCommitted = commitments.reduce(
            (sum, c) => sum + Number(c.committedAmount),
            0
        )

        // Create Capital Call #1 - Fully Funded
        const call1Amount = 4650000 // 30% of committed capital
        const call1 = await prisma.capitalCall.create({
            data: {
                fundId: fund.id,
                callNumber: 1,
                callDate: new Date('2026-01-20'),
                dueDate: new Date('2026-02-20'),
                totalAmount: call1Amount,
                forInvestment: 4000000,
                forFees: 500000,
                forExpenses: 150000,
                purpose: 'Initial capital call for fund operations and management fee reserve. Includes capital for potential acquisition of ABC Manufacturing.',
                dealReference: 'ABC Manufacturing',
                status: CapitalCallStatus.FULLY_FUNDED,
                noticeDate: new Date('2026-01-20'),
                completedDate: new Date('2026-02-15'),
            },
        })

        // Create call items for each investor
        for (const commitment of commitments) {
            const proRata = Number(commitment.committedAmount) / totalCommitted
            const callAmount = call1Amount * proRata

            await prisma.capitalCallItem.create({
                data: {
                    capitalCallId: call1.id,
                    investorId: commitment.investorId,
                    callAmount,
                    paidAmount: callAmount,
                    status: CallItemStatus.PAID,
                    paidDate: new Date('2026-02-15'),
                },
            })
        }

        console.log('Capital Call #1 created')

        // Create Capital Call #2 - Partially Funded
        const call2Amount = 3100000 // Another 20%
        const call2 = await prisma.capitalCall.create({
            data: {
                fundId: fund.id,
                callNumber: 2,
                callDate: new Date('2026-01-25'),
                dueDate: new Date('2026-02-25'),
                totalAmount: call2Amount,
                forInvestment: 3000000,
                forExpenses: 100000,
                purpose: 'Second capital call for TechFlow Solutions acquisition closing costs and working capital.',
                dealReference: 'TechFlow Solutions',
                status: CapitalCallStatus.SENT,
                noticeDate: new Date('2026-01-25'),
            },
        })

        // Create call items - some paid, some pending
        let itemIndex = 0
        for (const commitment of commitments) {
            const proRata = Number(commitment.committedAmount) / totalCommitted
            const callAmount = call2Amount * proRata
            const isPaid = itemIndex < 2 // First 2 investors paid

            await prisma.capitalCallItem.create({
                data: {
                    capitalCallId: call2.id,
                    investorId: commitment.investorId,
                    callAmount,
                    paidAmount: isPaid ? callAmount : 0,
                    status: isPaid ? CallItemStatus.PAID : CallItemStatus.NOTIFIED,
                    paidDate: isPaid ? new Date('2026-02-20') : null,
                },
            })
            itemIndex++
        }

        console.log('Capital Call #2 created')
    } else {
        console.log('Capital calls already exist')
    }

    // Create sample distribution
    console.log('[SEED] Creating distributions...')
    const existingDist = await prisma.distribution.findFirst({
        where: { fundId: fund.id, distributionNumber: 1 },
    })

    if (!existingDist) {
        // Get all active commitments
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: fund.id,
                status: { in: ['ACTIVE', 'FUNDED'] },
            },
        })

        const totalCommitted = commitments.reduce(
            (sum, c) => sum + Number(c.committedAmount),
            0
        )

        // Create Distribution #1 - Completed
        const dist1Amount = 775000 // Return from successful partial exit
        const dist1 = await prisma.distribution.create({
            data: {
                fundId: fund.id,
                distributionNumber: 1,
                distributionDate: new Date('2026-01-28'),
                totalAmount: dist1Amount,
                returnOfCapital: 500000,
                realizedGains: 250000,
                dividends: 25000,
                type: DistributionType.PROFIT_DISTRIBUTION,
                source: 'Partial exit - ABC Manufacturing real estate sale',
                status: DistributionStatus.COMPLETED,
                approvedDate: new Date('2026-01-26'),
                paidDate: new Date('2026-01-28'),
                notes: 'Distribution from the sale of excess real estate assets from ABC Manufacturing acquisition.',
            },
        })

        // Create distribution items for each investor
        for (const commitment of commitments) {
            const proRata = Number(commitment.committedAmount) / totalCommitted
            const grossAmount = dist1Amount * proRata
            const withholdingTax = 0 // No withholding for this distribution
            const netAmount = grossAmount - withholdingTax

            await prisma.distributionItem.create({
                data: {
                    distributionId: dist1.id,
                    investorId: commitment.investorId,
                    grossAmount,
                    withholdingTax,
                    netAmount,
                    status: DistItemStatus.PAID,
                    paidDate: new Date('2026-01-28'),
                    paymentMethod: 'Wire Transfer',
                },
            })
        }

        console.log('Distribution #1 created')
    } else {
        console.log('Distributions already exist')
    }

    // Create sample portfolio companies
    console.log('[SEED] Creating portfolio companies...')
    const existingPortfolio = await prisma.portfolioCompany.findFirst({
        where: { fundId: fund.id },
    })

    if (!existingPortfolio) {
        // Portfolio Company 1: ABC Manufacturing (from closed deal)
        const abcManufacturing = await prisma.portfolioCompany.create({
            data: {
                fundId: fund.id,
                name: 'ABC Manufacturing',
                legalName: 'ABC Manufacturing Co.',
                description: 'Precision metal fabrication company serving aerospace and defense industries with 40+ years of operational history.',
                website: 'https://abcmanufacturing.com',
                industry: 'Manufacturing',
                subIndustry: 'Metal Fabrication',
                businessModel: 'B2B',
                headquarters: 'Austin, TX',
                city: 'Austin',
                state: 'TX',
                country: 'USA',
                acquisitionDate: new Date('2025-06-15'),
                entryValuation: 12000000,
                entryRevenue: 18000000,
                entryEbitda: 2400000,
                entryMultiple: 5.0,
                equityInvested: 4800000,
                debtFinancing: 7200000,
                totalInvestment: 4800000,
                ownershipPct: 0.85,
                status: PortfolioStatus.HOLDING,
                unrealizedValue: 5520000, // 15% value increase
                totalValue: 5520000,
                moic: 1.15,
                ceoName: 'Robert Miller',
                ceoEmail: 'rmiller@abcmanufacturing.com',
                boardSeats: 2,
                investmentThesis: 'ABC Manufacturing has a strong market position in aerospace components with long-term customer contracts. Value creation through operational improvements, pricing optimization, and strategic add-on acquisitions.',
            },
        })

        // Add metrics for ABC Manufacturing
        await prisma.portfolioMetric.createMany({
            data: [
                {
                    companyId: abcManufacturing.id,
                    periodDate: new Date('2025-09-30'),
                    periodType: MetricPeriodType.QUARTERLY,
                    revenue: 4800000,
                    revenueGrowth: 0.08,
                    ebitda: 720000,
                    ebitdaMargin: 0.15,
                    employeeCount: 85,
                    currentValuation: 13200000,
                    highlights: 'Won new aerospace contract worth $2M annually. Successfully implemented ERP system.',
                },
                {
                    companyId: abcManufacturing.id,
                    periodDate: new Date('2025-12-31'),
                    periodType: MetricPeriodType.QUARTERLY,
                    revenue: 5100000,
                    revenueGrowth: 0.12,
                    ebitda: 816000,
                    ebitdaMargin: 0.16,
                    employeeCount: 92,
                    currentValuation: 13800000,
                    highlights: 'Record Q4 revenue. Added 3 new customers. Margin expansion from operational improvements.',
                },
            ],
        })

        console.log('Portfolio company ABC Manufacturing created with metrics')

        // Portfolio Company 2: TechFlow Solutions
        const techFlow = await prisma.portfolioCompany.create({
            data: {
                fundId: fund.id,
                name: 'TechFlow Solutions',
                legalName: 'TechFlow Solutions Inc.',
                description: 'IT managed services provider specializing in mid-market companies with recurring revenue model.',
                website: 'https://techflowsolutions.com',
                industry: 'Technology',
                subIndustry: 'IT Services',
                businessModel: 'Recurring Revenue / SaaS',
                headquarters: 'Dallas, TX',
                city: 'Dallas',
                state: 'TX',
                country: 'USA',
                acquisitionDate: new Date('2025-09-01'),
                entryValuation: 8500000,
                entryRevenue: 6200000,
                entryEbitda: 1200000,
                entryMultiple: 7.1,
                equityInvested: 3400000,
                debtFinancing: 5100000,
                totalInvestment: 3400000,
                ownershipPct: 0.90,
                status: PortfolioStatus.HOLDING,
                unrealizedValue: 3740000, // 10% increase
                totalValue: 3740000,
                moic: 1.10,
                ceoName: 'Sarah Chen',
                ceoEmail: 'schen@techflowsolutions.com',
                boardSeats: 2,
                investmentThesis: 'TechFlow has 95% recurring revenue with strong customer retention. Growth opportunities through geographic expansion and adding complementary services.',
            },
        })

        // Add metrics for TechFlow Solutions
        await prisma.portfolioMetric.createMany({
            data: [
                {
                    companyId: techFlow.id,
                    periodDate: new Date('2025-12-31'),
                    periodType: MetricPeriodType.QUARTERLY,
                    revenue: 1700000,
                    revenueGrowth: 0.15,
                    ebitda: 340000,
                    ebitdaMargin: 0.20,
                    employeeCount: 45,
                    customerCount: 120,
                    currentValuation: 9350000,
                    highlights: 'Added 15 new MSP contracts. Customer churn below 3%. Launched new cybersecurity offering.',
                },
            ],
        })

        console.log('Portfolio company TechFlow Solutions created with metrics')
    } else {
        console.log('Portfolio companies already exist')
    }

    console.log('Seed completed successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
