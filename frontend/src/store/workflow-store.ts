import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { WorkflowState } from '@/types/schema';

interface WorkflowStoreState {
    // Current workflow being viewed/edited
    currentWorkflow: WorkflowState | null;

    // List of recent workflows
    recentWorkflows: WorkflowState[];

    // Active workflow IDs (running)
    activeWorkflowIds: string[];

    // Actions
    setCurrentWorkflow: (workflow: WorkflowState | null) => void;
    addRecentWorkflow: (workflow: WorkflowState) => void;
    updateWorkflow: (workflowId: string, updates: Partial<WorkflowState>) => void;
    addActiveWorkflow: (workflowId: string) => void;
    removeActiveWorkflow: (workflowId: string) => void;
    clearRecentWorkflows: () => void;
}

export const useWorkflowStore = create<WorkflowStoreState>()(
    devtools(
        persist(
            (set, get) => ({
                currentWorkflow: null,
                recentWorkflows: [],
                activeWorkflowIds: [],

                setCurrentWorkflow: (workflow) => {
                    set({ currentWorkflow: workflow });
                    if (workflow) {
                        get().addRecentWorkflow(workflow);
                    }
                },

                addRecentWorkflow: (workflow) => {
                    set((state) => {
                        const existing = state.recentWorkflows.filter(
                            (w) => w.workflow_id !== workflow.workflow_id
                        );
                        return {
                            recentWorkflows: [workflow, ...existing].slice(0, 10),
                        };
                    });
                },

                updateWorkflow: (workflowId, updates) => {
                    set((state) => {
                        const updatedRecent = state.recentWorkflows.map((w) =>
                            w.workflow_id === workflowId ? { ...w, ...updates } : w
                        );
                        const updatedCurrent =
                            state.currentWorkflow?.workflow_id === workflowId
                                ? { ...state.currentWorkflow, ...updates }
                                : state.currentWorkflow;
                        return {
                            recentWorkflows: updatedRecent,
                            currentWorkflow: updatedCurrent,
                        };
                    });
                },

                addActiveWorkflow: (workflowId) => {
                    set((state) => ({
                        activeWorkflowIds: [...new Set([...state.activeWorkflowIds, workflowId])],
                    }));
                },

                removeActiveWorkflow: (workflowId) => {
                    set((state) => ({
                        activeWorkflowIds: state.activeWorkflowIds.filter((id) => id !== workflowId),
                    }));
                },

                clearRecentWorkflows: () => {
                    set({ recentWorkflows: [], currentWorkflow: null });
                },
            }),
            {
                name: 'pod-workflow-store',
                partialize: (state) => ({
                    recentWorkflows: state.recentWorkflows.slice(0, 5),
                }),
            }
        ),
        { name: 'WorkflowStore' }
    )
);
