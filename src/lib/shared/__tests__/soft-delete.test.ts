import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notDeleted, softDelete } from '../soft-delete'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        deal: { update: vi.fn().mockResolvedValue({}) },
        investor: { update: vi.fn().mockResolvedValue({}) },
        portfolioCompany: { update: vi.fn().mockResolvedValue({}) },
        document: { update: vi.fn().mockResolvedValue({}) },
        capitalCall: { update: vi.fn().mockResolvedValue({}) },
        distribution: { update: vi.fn().mockResolvedValue({}) },
        commitment: { update: vi.fn().mockResolvedValue({}) },
    },
}))

// Must import after mock setup
import { prisma } from '@/lib/prisma'

describe('notDeleted', () => {
    it('provides correct filter object', () => {
        expect(notDeleted).toEqual({ deletedAt: null })
    })
})

describe('softDelete', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('soft-deletes a deal by setting deletedAt', async () => {
        await softDelete('deal', 'deal-123')

        expect(prisma.deal.update).toHaveBeenCalledWith({
            where: { id: 'deal-123' },
            data: { deletedAt: expect.any(Date) },
        })
    })

    it('soft-deletes an investor', async () => {
        await softDelete('investor', 'inv-456')

        expect(prisma.investor.update).toHaveBeenCalledWith({
            where: { id: 'inv-456' },
            data: { deletedAt: expect.any(Date) },
        })
    })

    it('soft-deletes a portfolioCompany', async () => {
        await softDelete('portfolioCompany', 'pc-789')

        expect(prisma.portfolioCompany.update).toHaveBeenCalledWith({
            where: { id: 'pc-789' },
            data: { deletedAt: expect.any(Date) },
        })
    })

    it('soft-deletes a capitalCall', async () => {
        await softDelete('capitalCall', 'cc-111')

        expect(prisma.capitalCall.update).toHaveBeenCalledWith({
            where: { id: 'cc-111' },
            data: { deletedAt: expect.any(Date) },
        })
    })

    it('soft-deletes a distribution', async () => {
        await softDelete('distribution', 'dist-222')

        expect(prisma.distribution.update).toHaveBeenCalledWith({
            where: { id: 'dist-222' },
            data: { deletedAt: expect.any(Date) },
        })
    })

    it('soft-deletes a commitment', async () => {
        await softDelete('commitment', 'com-333')

        expect(prisma.commitment.update).toHaveBeenCalledWith({
            where: { id: 'com-333' },
            data: { deletedAt: expect.any(Date) },
        })
    })
})
