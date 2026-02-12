'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
}

export function DataPagination({ page, totalPages, total, pageSize }: DataPaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) {
        return (
            <div className="text-xs text-muted-foreground">
                {total} {total === 1 ? 'record' : 'records'}
            </div>
        );
    }

    function buildHref(targetPage: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(targetPage));
        return `${pathname}?${params.toString()}`;
    }

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
                Showing {start}–{end} of {total}
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={page <= 1}
                    asChild={page > 1}
                >
                    {page > 1 ? (
                        <Link href={buildHref(page - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    ) : (
                        <span><ChevronLeft className="h-4 w-4" /></span>
                    )}
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                >
                    {page < totalPages ? (
                        <Link href={buildHref(page + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <span><ChevronRight className="h-4 w-4" /></span>
                    )}
                </Button>
            </div>
        </div>
    );
}
