"""
POD Multi-Agent System - API Schemas
Pydantic models for request/response validation
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


# ============== Enums ==============

class WorkflowStatus(str, Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"


class QualityResult(str, Enum):
    """Quality check result"""
    PASS = "pass"
    RETRY = "retry"
    FAIL = "fail"


# ============== Request Models ==============

class WorkflowCreateRequest(BaseModel):
    """Request body for creating a new workflow"""
    niche: str = Field(..., min_length=1, max_length=100, description="Target niche market")
    style: str = Field(..., min_length=1, max_length=50, description="Design style")
    num_designs: int = Field(default=5, ge=1, le=20, description="Number of designs to generate")
    target_platforms: List[str] = Field(default=["etsy"], description="Target platforms")
    product_types: List[str] = Field(default=["t-shirt", "mug"], description="Product types")
    human_review: bool = Field(default=False, description="Require human review before upload")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "niche": "cat lovers",
                    "style": "minimalist",
                    "num_designs": 5,
                    "target_platforms": ["etsy"],
                    "product_types": ["t-shirt", "mug"],
                    "human_review": False
                }
            ]
        }
    }


class WorkflowApproveRequest(BaseModel):
    """Request body for approving/rejecting human review"""
    approved: bool = Field(..., description="Whether the workflow is approved")
    notes: Optional[str] = Field(default=None, max_length=500, description="Review notes")


# ============== Response Models ==============

class DesignResponse(BaseModel):
    """Design data response"""
    design_id: str = ""
    prompt: str = ""
    image_url: str = ""
    style: str = ""
    keywords: List[str] = []
    created_at: str = ""
    quality_score: Optional[float] = None
    quality_issues: Optional[List[str]] = None


class ProductResponse(BaseModel):
    """Product data response"""
    product_id: str = ""
    design_id: str = ""
    mockup_url: str = ""
    product_type: str = ""
    variant_ids: List[str] = []
    printful_sync_id: Optional[str] = None
    created_at: str = ""


class SEODataResponse(BaseModel):
    """SEO data response"""
    design_id: str = ""
    title: str = ""
    description: str = ""
    tags: List[str] = []
    keywords: List[str] = []
    optimized_at: str = ""


class ListingResponse(BaseModel):
    """Listing data response"""
    listing_id: str = ""
    design_id: str = ""
    platform: str = ""
    listing_url: str = ""
    status: str = ""
    listed_at: str = ""



class TrendDataResponse(BaseModel):
    """Trend analysis data response"""
    sub_topics: List[str] = []
    keywords: List[str] = []
    audience: Dict[str, Any] = {}  # Changed from Dict[str, str] to handle Any
    competition_level: str = ""
    seasonal_trends: Optional[List[str]] = None
    recommended_styles: List[str] = []
    analyzed_at: str = ""


class ErrorInfo(BaseModel):
    """Error information"""
    step: str = ""
    error_type: Optional[str] = None
    message: str = ""
    timestamp: str = ""



class WorkflowResponse(BaseModel):
    """Complete workflow state response"""
    # Identifiers
    workflow_id: str
    thread_id: str
    
    # Input parameters
    niche: str
    style: str
    num_designs: int
    target_platforms: List[str]
    product_types: List[str]
    
    # Status
    current_step: str
    status: WorkflowStatus
    
    # Retry info
    retry_count: int
    max_retries: int
    quality_check_result: Optional[QualityResult] = None
    
    # Human review
    human_review_required: bool
    human_review_approved: Optional[bool] = None
    human_review_notes: Optional[str] = None
    
    # Results (populated as workflow progresses)
    trend_data: Optional[TrendDataResponse] = None
    design_prompts: List[str] = []
    designs: List[DesignResponse] = []
    products: List[ProductResponse] = []
    seo_content: List[SEODataResponse] = []
    listings: List[ListingResponse] = []
    optimization_recommendations: Optional[Dict[str, List[str]]] = None
    
    # Cost tracking
    total_cost: float = 0.0
    cost_breakdown: Dict[str, float] = {}
    
    # Errors
    errors: List[ErrorInfo] = []
    
    # Timestamps
    started_at: str
    updated_at: str
    completed_at: Optional[str] = None


class WorkflowCreateResponse(BaseModel):
    """Response for workflow creation"""
    workflow_id: str
    thread_id: str
    status: WorkflowStatus
    message: str


class WorkflowListResponse(BaseModel):
    """Response for listing workflows"""
    workflows: List[WorkflowResponse]
    total: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: str
    langgraph_available: bool


class ErrorResponse(BaseModel):
    """API error response"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# ============== SSE Event Models ==============

class WorkflowEventData(BaseModel):
    """Data for SSE workflow events"""
    event_type: str  # "step_complete", "error", "done"
    step: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
