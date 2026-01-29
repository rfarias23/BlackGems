import { PrismaClient, UserRole, FundType, FundStatus, DealStage, DealStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create admin user
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

    // Create a default fund
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
            currency: 'USD',
            managementFee: 0.02, // 2%
            carriedInterest: 0.20, // 20%
            hurdleRate: 0.08, // 8%
            description: 'BlackGem Fund I focuses on acquiring and growing profitable SMBs in the manufacturing and business services sectors.',
        },
    })
    console.log('Fund created:', fund.name)

    // Create sample deals
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
            description: 'ABC Manufacturing is a 35-year-old manufacturer of industrial equipment with strong customer relationships and consistent margins.',
            city: 'Detroit',
            state: 'MI',
            country: 'USA',
            employeeCount: 45,
            yearFounded: 1991,
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
            description: 'B2B SaaS platform for workflow automation with strong recurring revenue.',
            city: 'Austin',
            state: 'TX',
            country: 'USA',
            employeeCount: 22,
            yearFounded: 2018,
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
            description: 'Regional logistics provider with fleet of 50+ trucks serving the Midwest.',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            employeeCount: 85,
            yearFounded: 2005,
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
            description: 'Commercial construction company specializing in tenant improvements.',
            city: 'Phoenix',
            state: 'AZ',
            country: 'USA',
            employeeCount: 38,
            yearFounded: 2008,
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
