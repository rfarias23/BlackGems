/** Shared pagination types and utilities */

export interface PaginationParams {
    page?: number
    pageSize?: number
    search?: string
}

export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export const DEFAULT_PAGE_SIZE = 25

export function parsePaginationParams(params?: PaginationParams): {
    page: number
    pageSize: number
    skip: number
    search: string | undefined
} {
    const page = Math.max(1, params?.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE))
    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
        search: params?.search?.trim() || undefined,
    }
}

export function paginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number
): PaginatedResult<T> {
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    }
}
