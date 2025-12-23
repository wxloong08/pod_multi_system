export type WorkflowStatus =
    | "pending"
    | "running"
    | "paused"
    | "completed"
    | "failed";

export type QualityResult = "pass" | "retry" | "fail";

export interface Design {
    design_id: string;
    prompt: string;
    image_url: string;
    style: string;
    keywords: string[];
    created_at: string;
    quality_score?: number;
    quality_issues?: string[];
}

export interface Product {
    product_id: string;
    design_id: string;
    mockup_url: string;
    product_type: string; // t-shirt, mug, etc.
    variant_ids: string[];
    printful_sync_id?: string;
    created_at: string;
}

export interface SEOData {
    design_id: string;
    title: string;
    description: string;
    tags: string[];
    keywords: string[];
    optimized_at: string;
}

export interface Listing {
    listing_id: string;
    design_id: string;
    platform: string;
    listing_url: string;
    status: string;
    listed_at: string;
}

export interface SalesMetrics {
    design_id: string;
    views: number;
    favorites: number;
    sales: number;
    revenue: number;
    conversion_rate: number;
    updated_at: string;
}

export interface TrendData {
    sub_topics: string[];
    keywords: string[];
    audience: Record<string, string>;
    competition_level: "low" | "medium" | "high" | string;
    seasonal_trends?: string[];
    recommended_styles: string[];
    analyzed_at: string;
}

export interface WorkflowState {
    // Input Layer
    niche: string;
    style: string;
    num_designs: number;
    target_platforms: string[];
    product_types: string[];

    // Result Layer
    trend_data?: TrendData;
    design_prompts: string[];
    designs: Design[];
    products: Product[];
    seo_content: SEOData[];
    listings: Listing[];
    sales_data?: SalesMetrics[];
    optimization_recommendations?: Record<string, string[]>;

    // Metadata Layer
    workflow_id: string;
    thread_id: string;
    current_step: string;
    status: WorkflowStatus;

    retry_count: number;
    max_retries: number;

    quality_check_result?: QualityResult;
    failed_design_ids: string[];

    human_review_required: boolean;
    human_review_approved?: boolean;
    human_review_notes?: string;

    errors: Array<{
        step: string;
        error_type?: string;
        message: string;
        timestamp: string;
    }>;

    total_cost: number;
    cost_breakdown: Record<string, number>;

    started_at: string;
    updated_at: string;
    completed_at?: string;
}
