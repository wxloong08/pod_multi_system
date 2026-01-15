'use client';

import { useQuery } from '@tanstack/react-query';
import { designApi } from '../services/api';

// Query keys
export const designKeys = {
    all: ['designs'] as const,
    lists: () => [...designKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...designKeys.lists(), filters] as const,
    details: () => [...designKeys.all, 'detail'] as const,
    detail: (id: string) => [...designKeys.details(), id] as const,
    stats: () => [...designKeys.all, 'stats'] as const,
};

// List designs
export function useDesigns(params?: {
    workflow_id?: string;
    style?: string;
    min_quality_score?: number;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: designKeys.list(params || {}),
        queryFn: () => designApi.list(params),
        staleTime: 30 * 1000, // 30 seconds
    });
}

// Get single design
export function useDesign(designId: string | undefined) {
    return useQuery({
        queryKey: designKeys.detail(designId || ''),
        queryFn: () => {
            if (!designId) throw new Error('Design ID required');
            return designApi.get(designId);
        },
        enabled: !!designId,
        staleTime: 60 * 1000, // 1 minute
    });
}

// Get design stats
export function useDesignStats() {
    return useQuery({
        queryKey: designKeys.stats(),
        queryFn: () => designApi.getStats(),
        staleTime: 60 * 1000, // 1 minute
    });
}
