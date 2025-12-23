'use client';

import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/services/api';

export function useHealth() {
    return useQuery({
        queryKey: ['health'],
        queryFn: () => healthApi.check(),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000, // Check every minute
        retry: 2,
    });
}
