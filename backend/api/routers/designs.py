"""
POD Multi-Agent System - Designs API Routes
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query

from api.schemas import DesignResponse, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/designs", tags=["Designs"])

# Import workflows storage for accessing designs
from api.routers.workflows import _workflows


def safe_get(d: dict, key: str, default=""):
    """安全获取字典值，None 视为缺失"""
    val = d.get(key)
    return val if val is not None else default


@router.get(
    "",
    response_model=List[DesignResponse],
    summary="List all designs",
    description="Get a list of all generated designs across all workflows."
)
async def list_designs(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    style: Optional[str] = Query(None, description="Filter by design style"),
    min_quality_score: Optional[float] = Query(None, ge=0, le=1, description="Minimum quality score"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """List all designs with optional filtering"""
    all_designs = []
    
    # Collect designs from all workflows
    for wf_id, workflow in _workflows.items():
        if workflow_id and wf_id != workflow_id:
            continue
        
        for design in workflow.get("designs", []):
            design_data = dict(design)
            design_data["_workflow_id"] = wf_id  # Add workflow reference
            all_designs.append(design_data)
    
    # Apply filters
    if style:
        all_designs = [d for d in all_designs if safe_get(d, "style", "").lower() == style.lower()]
    
    if min_quality_score is not None:
        all_designs = [d for d in all_designs if (d.get("quality_score") or 0) >= min_quality_score]
    
    # Sort by created_at (newest first)
    all_designs.sort(key=lambda d: safe_get(d, "created_at", ""), reverse=True)
    
    # Paginate
    all_designs = all_designs[offset:offset + limit]
    
    # Convert to response format - 使用 safe_get 避免 None 值
    return [
        DesignResponse(
            design_id=safe_get(d, "design_id"),
            prompt=safe_get(d, "prompt"),
            image_url=safe_get(d, "image_url"),
            style=safe_get(d, "style"),
            keywords=d.get("keywords") or [],
            created_at=safe_get(d, "created_at"),
            quality_score=d.get("quality_score"),
            quality_issues=d.get("quality_issues"),
        )
        for d in all_designs
    ]


@router.get(
    "/{design_id}",
    response_model=DesignResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get design details",
    description="Get details of a specific design by ID."
)
async def get_design(design_id: str):
    """Get a specific design by ID"""
    # Search across all workflows
    for workflow in _workflows.values():
        for design in workflow.get("designs", []):
            if design.get("design_id") == design_id:
                return DesignResponse(
                    design_id=safe_get(design, "design_id"),
                    prompt=safe_get(design, "prompt"),
                    image_url=safe_get(design, "image_url"),
                    style=safe_get(design, "style"),
                    keywords=design.get("keywords") or [],
                    created_at=safe_get(design, "created_at"),
                    quality_score=design.get("quality_score"),
                    quality_issues=design.get("quality_issues"),
                )
    
    raise HTTPException(status_code=404, detail=f"Design {design_id} not found")


@router.get(
    "/stats/summary",
    summary="Get design statistics",
    description="Get summary statistics for all designs."
)
async def get_design_stats():
    """Get design statistics"""
    all_designs = []
    for workflow in _workflows.values():
        all_designs.extend(workflow.get("designs", []))
    
    if not all_designs:
        return {
            "total_designs": 0,
            "average_quality_score": None,
            "styles": {},
            "quality_distribution": {"high": 0, "medium": 0, "low": 0}
        }
    
    # Calculate stats
    quality_scores = [d.get("quality_score") for d in all_designs if d.get("quality_score") is not None]
    styles = {}
    for d in all_designs:
        style = d.get("style", "unknown")
        styles[style] = styles.get(style, 0) + 1
    
    # Quality distribution
    high = sum(1 for s in quality_scores if s >= 0.8)
    medium = sum(1 for s in quality_scores if 0.5 <= s < 0.8)
    low = sum(1 for s in quality_scores if s < 0.5)
    
    return {
        "total_designs": len(all_designs),
        "average_quality_score": sum(quality_scores) / len(quality_scores) if quality_scores else None,
        "styles": styles,
        "quality_distribution": {
            "high": high,
            "medium": medium,
            "low": low
        }
    }
