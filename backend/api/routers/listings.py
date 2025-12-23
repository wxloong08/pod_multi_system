"""
POD Multi-Agent System - Listings API Routes
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query

from api.schemas import ListingResponse, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/listings", tags=["Listings"])

# Import workflows storage for accessing listings
from api.routers.workflows import _workflows


@router.get(
    "",
    response_model=List[ListingResponse],
    summary="List all listings",
    description="Get a list of all published listings across all workflows."
)
async def list_listings(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    platform: Optional[str] = Query(None, description="Filter by platform (etsy, amazon, etc.)"),
    status: Optional[str] = Query(None, description="Filter by listing status"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """List all listings with optional filtering"""
    all_listings = []
    
    # Collect listings from all workflows
    for wf_id, workflow in _workflows.items():
        if workflow_id and wf_id != workflow_id:
            continue
        
        for listing in workflow.get("listings", []):
            listing_data = dict(listing)
            listing_data["_workflow_id"] = wf_id
            all_listings.append(listing_data)
    
    # Apply filters
    if platform:
        all_listings = [l for l in all_listings if l.get("platform", "").lower() == platform.lower()]
    
    if status:
        all_listings = [l for l in all_listings if l.get("status", "").lower() == status.lower()]
    
    # Sort by listed_at (newest first)
    all_listings.sort(key=lambda l: l.get("listed_at", ""), reverse=True)
    
    # Paginate
    all_listings = all_listings[offset:offset + limit]
    
    # Convert to response format
    return [
        ListingResponse(
            listing_id=l.get("listing_id", ""),
            design_id=l.get("design_id", ""),
            platform=l.get("platform", ""),
            listing_url=l.get("listing_url", ""),
            status=l.get("status", ""),
            listed_at=l.get("listed_at", ""),
        )
        for l in all_listings
    ]


@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get listing details",
    description="Get details of a specific listing by ID."
)
async def get_listing(listing_id: str):
    """Get a specific listing by ID"""
    for workflow in _workflows.values():
        for listing in workflow.get("listings", []):
            if listing.get("listing_id") == listing_id:
                return ListingResponse(
                    listing_id=listing.get("listing_id", ""),
                    design_id=listing.get("design_id", ""),
                    platform=listing.get("platform", ""),
                    listing_url=listing.get("listing_url", ""),
                    status=listing.get("status", ""),
                    listed_at=listing.get("listed_at", ""),
                )
    
    raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found")


@router.get(
    "/stats/summary",
    summary="Get listing statistics",
    description="Get summary statistics for all listings."
)
async def get_listing_stats():
    """Get listing statistics"""
    all_listings = []
    for workflow in _workflows.values():
        all_listings.extend(workflow.get("listings", []))
    
    if not all_listings:
        return {
            "total_listings": 0,
            "platforms": {},
            "statuses": {}
        }
    
    # Calculate stats
    platforms = {}
    statuses = {}
    
    for listing in all_listings:
        platform = listing.get("platform", "unknown")
        status = listing.get("status", "unknown")
        platforms[platform] = platforms.get(platform, 0) + 1
        statuses[status] = statuses.get(status, 0) + 1
    
    return {
        "total_listings": len(all_listings),
        "platforms": platforms,
        "statuses": statuses
    }
