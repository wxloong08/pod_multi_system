'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi, type WorkflowCreateRequest } from '../services/api';
import { useWorkflowStore } from '../store';
import type { WorkflowState } from '../types/schema';

// Query keys
export const workflowKeys = {
    all: ['workflows'] as const,
    lists: () => [...workflowKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...workflowKeys.lists(), filters] as const,
    details: () => [...workflowKeys.all, 'detail'] as const,
    detail: (id: string) => [...workflowKeys.details(), id] as const,
};

// List workflows
export function useWorkflows(params?: {
    status?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: workflowKeys.list(params || {}),
        queryFn: () => workflowApi.list(params),
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });
}

// Get single workflow
export function useWorkflow(workflowId: string | undefined) {
    const { setCurrentWorkflow, updateWorkflow } = useWorkflowStore();

    return useQuery({
        queryKey: workflowKeys.detail(workflowId || ''),
        queryFn: async () => {
            if (!workflowId) throw new Error('Workflow ID required');
            const workflow = await workflowApi.get(workflowId);
            setCurrentWorkflow(workflow);
            return workflow;
        },
        enabled: !!workflowId,
        staleTime: 5 * 1000,
        refetchInterval: (query) => {
            // Refetch more frequently if workflow is running
            const data = query.state.data as WorkflowState | undefined;
            if (data?.status === 'running' || data?.status === 'pending') {
                return 3 * 1000; // 3 seconds
            }
            return 30 * 1000; // 30 seconds
        },
    });
}

// Create workflow
export function useCreateWorkflow() {
    const queryClient = useQueryClient();
    const { addActiveWorkflow } = useWorkflowStore();

    return useMutation({
        mutationFn: (data: WorkflowCreateRequest) => workflowApi.create(data),
        onSuccess: (response) => {
            // Invalidate workflow list
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            // Track as active workflow
            addActiveWorkflow(response.workflow_id);
        },
    });
}

// Approve/reject workflow
export function useApproveWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            workflowId,
            approved,
            notes,
        }: {
            workflowId: string;
            approved: boolean;
            notes?: string;
        }) => workflowApi.approve(workflowId, approved, notes),
        onSuccess: (workflow) => {
            // Update cache
            queryClient.setQueryData(workflowKeys.detail(workflow.workflow_id), workflow);
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
        },
    });
}

// Delete workflow
export function useDeleteWorkflow() {
    const queryClient = useQueryClient();
    const { removeActiveWorkflow } = useWorkflowStore();

    return useMutation({
        mutationFn: (workflowId: string) => workflowApi.delete(workflowId),
        onSuccess: (_, workflowId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: workflowKeys.detail(workflowId) });
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            removeActiveWorkflow(workflowId);
        },
    });
}

// Hook for SSE streaming
export function useWorkflowStream(workflowId: string | undefined) {
    const { updateWorkflow } = useWorkflowStore();
    const queryClient = useQueryClient();

    const startStream = () => {
        if (!workflowId) return null;

        const eventSource = new EventSource(workflowApi.streamUrl(workflowId));

        eventSource.addEventListener('update', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[SSE] Update:', data);

                // Invalidate to refetch
                queryClient.invalidateQueries({ queryKey: workflowKeys.detail(workflowId) });
            } catch (e) {
                console.error('[SSE] Parse error:', e);
            }
        });

        eventSource.addEventListener('done', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[SSE] Done:', data);

                // Invalidate all workflow queries
                queryClient.invalidateQueries({ queryKey: workflowKeys.all });
            } catch (e) {
                console.error('[SSE] Parse error:', e);
            }
            eventSource.close();
        });

        eventSource.addEventListener('error', (event) => {
            console.error('[SSE] Error:', event);
            eventSource.close();
        });

        return eventSource;
    };

    return { startStream };
}
