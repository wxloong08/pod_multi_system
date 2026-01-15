import axios from 'axios';
import type {
    WorkflowState,
    Design,
    Listing,
} from '../types/schema';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Future: Add Authorization header here
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
        }
        return Promise.reject(error);
    }
);

// ============== Types ==============

export interface WorkflowCreateRequest {
    niche: string;
    style: string;
    num_designs?: number;
    target_platforms?: string[];
    product_types?: string[];
    human_review?: boolean;
}

export interface WorkflowCreateResponse {
    workflow_id: string;
    thread_id: string;
    status: string;
    message: string;
}

export interface WorkflowListResponse {
    workflows: WorkflowState[];
    total: number;
}

export interface HealthResponse {
    status: string;
    version: string;
    timestamp: string;
    langgraph_available: boolean;
}

export interface DesignStats {
    total_designs: number;
    average_quality_score: number | null;
    styles: Record<string, number>;
    quality_distribution: {
        high: number;
        medium: number;
        low: number;
    };
}

export interface ListingStats {
    total_listings: number;
    platforms: Record<string, number>;
    statuses: Record<string, number>;
}

// ============== Health API ==============

export const healthApi = {
    check: async (): Promise<HealthResponse> => {
        const response = await api.get<HealthResponse>('/health');
        return response.data;
    },
};

// ============== Workflow API ==============

export const workflowApi = {
    create: async (data: WorkflowCreateRequest): Promise<WorkflowCreateResponse> => {
        const response = await api.post<WorkflowCreateResponse>('/api/v1/workflows', data);
        return response.data;
    },

    list: async (params?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<WorkflowListResponse> => {
        const response = await api.get<WorkflowListResponse>('/api/v1/workflows', { params });
        return response.data;
    },

    get: async (workflowId: string): Promise<WorkflowState> => {
        const response = await api.get<WorkflowState>(`/api/v1/workflows/${workflowId}`);
        return response.data;
    },

    approve: async (workflowId: string, approved: boolean, notes?: string): Promise<WorkflowState> => {
        const response = await api.post<WorkflowState>(`/api/v1/workflows/${workflowId}/approve`, {
            approved,
            notes,
        });
        return response.data;
    },

    delete: async (workflowId: string): Promise<void> => {
        await api.delete(`/api/v1/workflows/${workflowId}`);
    },

    // SSE Stream for real-time updates
    streamUrl: (workflowId: string): string => {
        return `${API_URL}/api/v1/workflows/${workflowId}/stream`;
    },
};

// ============== Designs API ==============

export const designApi = {
    list: async (params?: {
        workflow_id?: string;
        style?: string;
        min_quality_score?: number;
        limit?: number;
        offset?: number;
    }): Promise<Design[]> => {
        const response = await api.get<Design[]>('/api/v1/designs', { params });
        return response.data;
    },

    get: async (designId: string): Promise<Design> => {
        const response = await api.get<Design>(`/api/v1/designs/${designId}`);
        return response.data;
    },

    getStats: async (): Promise<DesignStats> => {
        const response = await api.get<DesignStats>('/api/v1/designs/stats/summary');
        return response.data;
    },
};

// ============== Listings API ==============

export const listingApi = {
    list: async (params?: {
        workflow_id?: string;
        platform?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<Listing[]> => {
        const response = await api.get<Listing[]>('/api/v1/listings', { params });
        return response.data;
    },

    get: async (listingId: string): Promise<Listing> => {
        const response = await api.get<Listing>(`/api/v1/listings/${listingId}`);
        return response.data;
    },

    getStats: async (): Promise<ListingStats> => {
        const response = await api.get<ListingStats>('/api/v1/listings/stats/summary');
        return response.data;
    },
};

export default api;
