'use client';

import { useQuery } from '@tanstack/react-query';
import { listingApi } from '@/services/api';

// Query keys
export const listingKeys = {
    all: ['listings'] as const,
    lists: () => [...listingKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...listingKeys.lists(), filters] as const,
    details: () => [...listingKeys.all, 'detail'] as const,
    detail: (id: string) => [...listingKeys.details(), id] as const,
    stats: () => [...listingKeys.all, 'stats'] as const,
};

// List listings
export function useListings(params?: {
    workflow_id?: string;
    platform?: string;
    status?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: listingKeys.list(params || {}),
        queryFn: () => listingApi.list(params),
        staleTime: 30 * 1000, // 30 seconds
    });
}

// Get single listing
export function useListing(listingId: string | undefined) {
    return useQuery({
        queryKey: listingKeys.detail(listingId || ''),
        queryFn: () => {
            if (!listingId) throw new Error('Listing ID required');
            return listingApi.get(listingId);
        },
        enabled: !!listingId,
        staleTime: 60 * 1000, // 1 minute
    });
}

// Get listing stats
export function useListingStats() {
    return useQuery({
        queryKey: listingKeys.stats(),
        queryFn: () => listingApi.getStats(),
        staleTime: 60 * 1000, // 1 minute
    });
}
