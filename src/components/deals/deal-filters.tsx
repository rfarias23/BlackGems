'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, ArrowUpDown, X } from 'lucide-react'

const STAGES = [
    'Identified',
    'Initial Review',
    'NDA Signed',
    'IOI Submitted',
    'LOI Negotiation',
    'Due Diligence',
    'Closing',
    'Closed Won',
    'Closed Lost',
    'On Hold',
] as const

const STATUSES = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'PASSED', label: 'Passed' },
    { value: 'LOST', label: 'Lost' },
    { value: 'WON', label: 'Won' },
] as const

const SORT_OPTIONS = [
    { value: 'createdAt-desc', label: 'Newest first' },
    { value: 'createdAt-asc', label: 'Oldest first' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'askingPrice-desc', label: 'Price high-low' },
    { value: 'askingPrice-asc', label: 'Price low-high' },
    { value: 'stage-asc', label: 'Stage early-late' },
    { value: 'stage-desc', label: 'Stage late-early' },
] as const

export function DealFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()

    // Derive state from URL
    const currentSearch = searchParams.get('search') || ''
    const currentStages = searchParams.get('stages')?.split(',').filter(Boolean) || []
    const currentStatus = searchParams.get('status') || ''
    const currentSortBy = searchParams.get('sortBy') || 'createdAt'
    const currentSortDir = searchParams.get('sortDir') || 'desc'
    const currentSort = `${currentSortBy}-${currentSortDir}`

    // Local search state for debounce
    const [searchValue, setSearchValue] = useState(currentSearch)

    // Sync local search when URL changes externally
    useEffect(() => {
        setSearchValue(currentSearch)
    }, [currentSearch])

    const hasFilters = currentSearch || currentStages.length > 0 || currentStatus || currentSort !== 'createdAt-desc'

    const pushParams = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString())
            // Reset page on any filter change
            params.delete('page')

            for (const [key, value] of Object.entries(updates)) {
                if (value === null || value === '') {
                    params.delete(key)
                } else {
                    params.set(key, value)
                }
            }

            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`, { scroll: false })
            })
        },
        [router, pathname, searchParams, startTransition]
    )

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== currentSearch) {
                pushParams({ search: searchValue || null })
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchValue, currentSearch, pushParams])

    function handleStageToggle(stage: string) {
        const next = currentStages.includes(stage)
            ? currentStages.filter((s) => s !== stage)
            : [...currentStages, stage]
        pushParams({ stages: next.length > 0 ? next.join(',') : null })
    }

    function handleStatusChange(value: string) {
        pushParams({ status: value === 'all' ? null : value })
    }

    function handleSortChange(value: string) {
        const [sortBy, sortDir] = value.split('-')
        if (sortBy === 'createdAt' && sortDir === 'desc') {
            pushParams({ sortBy: null, sortDir: null })
        } else {
            pushParams({ sortBy, sortDir })
        }
    }

    function clearFilters() {
        setSearchValue('')
        startTransition(() => {
            router.push(pathname, { scroll: false })
        })
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search deals..."
                    className="pl-8 bg-card border-border"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </div>

            {/* Stage filter (multi-select dropdown) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border bg-card text-foreground hover:bg-[#334155]"
                    >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Stage
                        {currentStages.length > 0 && (
                            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3E5CFF] text-xs text-white">
                                {currentStages.length}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel className="text-xs tracking-wider uppercase text-[#94A3B8]">
                        Pipeline Stage
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STAGES.map((stage) => (
                        <DropdownMenuCheckboxItem
                            key={stage}
                            checked={currentStages.includes(stage)}
                            onCheckedChange={() => handleStageToggle(stage)}
                            onSelect={(e) => e.preventDefault()}
                            className="text-[#F8FAFC] focus:bg-[#334155] focus:text-[#F8FAFC]"
                        >
                            {stage}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Status filter */}
            <Select value={currentStatus || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] bg-card border-border text-sm">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                            {s.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[160px] bg-card border-border text-sm">
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Sort" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Clear
                </Button>
            )}
        </div>
    )
}
