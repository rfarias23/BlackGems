import { Button } from '@/components/ui/button'
import { DealTable, DealTableItem } from '@/components/deals/deal-table'
import { DealFilters } from '@/components/deals/deal-filters'
import { DealStage } from '@/components/deals/deal-stage-badge'
import { DataPagination } from '@/components/ui/data-pagination'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getDeals, getDealPipelineAnalytics } from '@/lib/actions/deals'
import { DealPipelineAnalytics } from '@/components/deals/deal-pipeline-analytics'

interface DealsPageProps {
    searchParams: Promise<{
        page?: string
        search?: string
        stages?: string
        status?: string
        sortBy?: string
        sortDir?: string
    }>
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const stages = params.stages?.split(',').filter(Boolean)
    const sortBy = (params.sortBy || 'createdAt') as 'name' | 'createdAt' | 'askingPrice' | 'stage'
    const sortDir = (params.sortDir || 'desc') as 'asc' | 'desc'

    const [result, pipelineAnalytics] = await Promise.all([
        getDeals({
            page,
            search: params.search,
            stages,
            status: params.status,
            sortBy,
            sortDir,
        }),
        getDealPipelineAnalytics(),
    ])

    const tableDeals: DealTableItem[] = result.data.map((deal) => ({
        id: deal.id,
        name: deal.name,
        stage: deal.stage as DealStage,
        sector: deal.industry,
        askPrice: deal.askingPrice || 'TBD',
        date: deal.createdAt.toISOString().split('T')[0],
    }))

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">Deal Pipeline</h2>
                    <p className="text-muted-foreground">
                        Manage your acquisition targets and track deal flow.
                    </p>
                </div>
                <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    <Link href="/deals/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Deal
                    </Link>
                </Button>
            </div>

            {pipelineAnalytics && (
                <DealPipelineAnalytics analytics={pipelineAnalytics} />
            )}

            <DealFilters />
            <DealTable deals={tableDeals} sortBy={sortBy} sortDir={sortDir} />
            <DataPagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                pageSize={result.pageSize}
            />
        </div>
    )
}
