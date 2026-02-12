'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DealStageBadge, DealStage } from './deal-stage-badge'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUp, ArrowDown } from 'lucide-react'

export interface DealTableItem {
    id: string
    name: string
    stage: DealStage
    sector: string | null
    askPrice: string | null
    date: string
}

interface DealTableProps {
    deals: DealTableItem[]
    sortBy?: string
    sortDir?: string
}

type SortField = 'name' | 'createdAt' | 'askingPrice' | 'stage'

const SORTABLE_COLUMNS: { key: SortField; label: string }[] = [
    { key: 'name', label: 'Company Name' },
    { key: 'stage', label: 'Stage' },
    { key: 'askingPrice', label: 'Ask Price' },
    { key: 'createdAt', label: 'Date Added' },
]

function SortableHeader({
    field,
    label,
    currentSort,
    currentDir,
}: {
    field: SortField
    label: string
    currentSort: string
    currentDir: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const isActive = currentSort === field

    function handleSort() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')

        if (isActive && currentDir === 'asc') {
            params.set('sortBy', field)
            params.set('sortDir', 'desc')
        } else if (isActive && currentDir === 'desc' && field === 'createdAt') {
            // Default sort: remove params to go back to default
            params.delete('sortBy')
            params.delete('sortDir')
        } else {
            params.set('sortBy', field)
            params.set('sortDir', 'asc')
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <button
            onClick={handleSort}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
            {label}
            {isActive && (
                currentDir === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />
            )}
        </button>
    )
}

export function DealTable({ deals, sortBy = 'createdAt', sortDir = 'desc' }: DealTableProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {SORTABLE_COLUMNS.map((col) => (
                                <TableHead key={col.key}>
                                    <SortableHeader
                                        field={col.key}
                                        label={col.label}
                                        currentSort={sortBy}
                                        currentDir={sortDir}
                                    />
                                </TableHead>
                            ))}
                            <TableHead>Sector</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No deals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            deals.map((deal) => (
                                <TableRow key={deal.id}>
                                    <TableCell className="font-medium text-foreground">
                                        <Link href={`/deals/${deal.id}`} className="hover:underline hover:text-primary">
                                            {deal.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <DealStageBadge stage={deal.stage} />
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums">
                                        {deal.askPrice}
                                    </TableCell>
                                    <TableCell className="font-mono tabular-nums">
                                        {deal.date}
                                    </TableCell>
                                    <TableCell>{deal.sector}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/deals/${deal.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
