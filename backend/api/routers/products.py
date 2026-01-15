"""
POD Multi-Agent System - Products API Routes
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["Products"])

# Import workflows storage for accessing products
from api.routers.workflows import _workflows


class ProductResponse(BaseModel):
    """产品响应模型"""
    product_id: str
    design_id: str
    product_type: str
    mockup_url: str = ""
    variants: List[dict] = []
    printful_product_id: Optional[str] = None
    created_at: str = ""


def safe_get(d: dict, key: str, default=""):
    """安全获取字典值，None 视为缺失"""
    val = d.get(key)
    return val if val is not None else default


@router.get(
    "",
    response_model=List[ProductResponse],
    summary="List all products",
    description="Get a list of all generated products across all workflows."
)
async def list_products(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    product_type: Optional[str] = Query(None, description="Filter by product type"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """List all products with optional filtering"""
    all_products = []
    
    # Collect products from all workflows
    for wf_id, workflow in _workflows.items():
        if workflow_id and wf_id != workflow_id:
            continue
        
        for product in workflow.get("products", []):
            product_data = dict(product)
            product_data["_workflow_id"] = wf_id
            all_products.append(product_data)
    
    # Apply filters
    if product_type:
        all_products = [p for p in all_products if safe_get(p, "product_type", "").lower() == product_type.lower()]
    
    # Sort by created_at (newest first)
    all_products.sort(key=lambda p: safe_get(p, "created_at", ""), reverse=True)
    
    # Paginate
    all_products = all_products[offset:offset + limit]
    
    # Convert to response format
    return [
        ProductResponse(
            product_id=safe_get(p, "product_id"),
            design_id=safe_get(p, "design_id"),
            product_type=safe_get(p, "product_type"),
            mockup_url=safe_get(p, "mockup_url"),
            variants=p.get("variants") or [],
            printful_product_id=p.get("printful_product_id"),
            created_at=safe_get(p, "created_at"),
        )
        for p in all_products
    ]


@router.get(
    "/stats/summary",
    summary="Get products statistics",
    description="Get aggregated statistics about all products."
)
async def get_products_stats():
    """Get products statistics"""
    all_products = []
    
    for workflow in _workflows.values():
        all_products.extend(workflow.get("products", []))
    
    # Calculate stats
    product_types = {}
    for product in all_products:
        pt = safe_get(product, "product_type", "unknown")
        product_types[pt] = product_types.get(pt, 0) + 1
    
    return {
        "total_products": len(all_products),
        "product_types": product_types,
    }


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get a specific product",
    description="Get details of a specific product by ID."
)
async def get_product(product_id: str):
    """Get a specific product"""
    for workflow in _workflows.values():
        for product in workflow.get("products", []):
            if product.get("product_id") == product_id:
                return ProductResponse(
                    product_id=safe_get(product, "product_id"),
                    design_id=safe_get(product, "design_id"),
                    product_type=safe_get(product, "product_type"),
                    mockup_url=safe_get(product, "mockup_url"),
                    variants=product.get("variants") or [],
                    printful_product_id=product.get("printful_product_id"),
                    created_at=safe_get(product, "created_at"),
                )
    
    raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
