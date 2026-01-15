"""
POD Multi-Agent System - Workflow API Routes
"""

import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks
from sse_starlette.sse import EventSourceResponse

from api.schemas import (
    WorkflowCreateRequest,
    WorkflowApproveRequest,
    WorkflowResponse,
    WorkflowCreateResponse,
    WorkflowListResponse,
    WorkflowEventData,
    ErrorResponse,
)
from core import create_pod_workflow, PODState
from core.state import WorkflowStatus
from core.rate_limiter import DailyRateLimiter
from config import load_config_from_env

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workflows", tags=["Workflows"])

# In-memory workflow storage (for demo - use Redis/DB in production)
_workflows: Dict[str, Dict[str, Any]] = {}
_workflow_runners: Dict[str, Any] = {}


def _state_to_response(state: Dict[str, Any]) -> WorkflowResponse:
    """Convert internal PODState to API response"""
    # 辅助函数：确保字符串字段不为 None
    def str_or_empty(val) -> str:
        return val if val is not None else ""
    
    # 辅助函数：清洗 dict 中的 None 值为空字符串（用于嵌套对象）
    # 已知应该是列表类型的字段
    LIST_FIELDS = {"quality_issues", "keywords", "variants", "errors", "target_platforms", "product_types"}
    
    def sanitize_dict(d: dict) -> dict:
        if not isinstance(d, dict):
            return {}
        result = {}
        for k, v in d.items():
            if v is None:
                # 根据字段类型设置默认值
                if k in LIST_FIELDS:
                    result[k] = []
                elif k not in ["quality_score", "printful_sync_id", "error_type"]:
                    result[k] = ""
                else:
                    result[k] = None
            elif k in LIST_FIELDS and (v == "" or not isinstance(v, list)):
                # 如果字段应该是列表但值是空字符串或其他非列表类型
                result[k] = [] if v == "" else [v]
            elif isinstance(v, list):
                result[k] = sanitize_list(v)
            elif isinstance(v, dict):
                result[k] = sanitize_dict(v)
            else:
                result[k] = v
        return result
    
    # 辅助函数：清洗列表中的每个 dict，并处理非列表输入
    def sanitize_list(lst) -> list:
        # 处理 None、空字符串、或其他非列表类型
        if lst is None or lst == "" or not isinstance(lst, list):
            return []
        return [sanitize_dict(item) if isinstance(item, dict) else item for item in lst]
    
    return WorkflowResponse(
        workflow_id=str_or_empty(state.get("workflow_id")),
        thread_id=str_or_empty(state.get("thread_id")),
        niche=str_or_empty(state.get("niche")),
        style=str_or_empty(state.get("style")),
        num_designs=state.get("num_designs", 0) or 0,
        target_platforms=sanitize_list(state.get("target_platforms")),
        product_types=sanitize_list(state.get("product_types")),
        current_step=str_or_empty(state.get("current_step")),
        status=state.get("status", WorkflowStatus.PENDING),
        retry_count=state.get("retry_count", 0) or 0,
        max_retries=state.get("max_retries", 3) or 3,
        quality_check_result=state.get("quality_check_result"),
        human_review_required=state.get("human_review_required", False) or False,
        human_review_approved=state.get("human_review_approved"),
        human_review_notes=state.get("human_review_notes"),
        trend_data=sanitize_dict(state.get("trend_data")) if state.get("trend_data") else None,
        design_prompts=sanitize_list(state.get("design_prompts")),
        designs=sanitize_list(state.get("designs")),
        products=sanitize_list(state.get("products")),
        seo_content=sanitize_list(state.get("seo_content")),
        listings=sanitize_list(state.get("listings")),
        optimization_recommendations=state.get("optimization_recommendations"),
        total_cost=state.get("total_cost", 0.0) or 0.0,
        cost_breakdown=state.get("cost_breakdown") or {},
        errors=sanitize_list(state.get("errors")),
        started_at=str_or_empty(state.get("started_at")),
        updated_at=str_or_empty(state.get("updated_at")),
        completed_at=state.get("completed_at"),
    )


async def _run_workflow_async(
    workflow_id: str,
    runner: Any,
    niche: str,
    style: str,
    num_designs: int,
    target_platforms: list,
    product_types: list,
):
    """Run workflow in background"""
    try:
        logger.info(f"Starting workflow {workflow_id} in background")
        
        # Update status to running
        if workflow_id in _workflows:
            _workflows[workflow_id]["status"] = WorkflowStatus.RUNNING
            _workflows[workflow_id]["updated_at"] = datetime.now().isoformat()
        
        # Run the workflow (this is synchronous, so we run in executor)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: runner.run(
                niche=niche,
                style=style,
                num_designs=num_designs,
                target_platforms=target_platforms,
                product_types=product_types,
            )
        )
        
        # Store result - merge with initial state to preserve input fields
        if result:
            # 保留初始状态的字段，只更新 LangGraph 返回的结果
            if workflow_id in _workflows:
                _workflows[workflow_id].update(result)
                _workflows[workflow_id]["status"] = WorkflowStatus.COMPLETED
                _workflows[workflow_id]["completed_at"] = datetime.now().isoformat()
            else:
                _workflows[workflow_id] = result
            logger.info(f"Workflow {workflow_id} completed successfully")
        
    except Exception as e:
        logger.exception(f"Workflow {workflow_id} failed: {e}")
        if workflow_id in _workflows:
            _workflows[workflow_id]["status"] = WorkflowStatus.FAILED
            _workflows[workflow_id]["errors"] = _workflows[workflow_id].get("errors", []) + [{
                "step": "workflow_execution",
                "error_type": type(e).__name__,
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }]


@router.post(
    "",
    response_model=WorkflowCreateResponse,
    responses={400: {"model": ErrorResponse}},
    summary="Create a new POD workflow",
    description="Start a new workflow to generate designs, create products, and publish listings."
)
async def create_workflow(
    request: WorkflowCreateRequest,
    background_tasks: BackgroundTasks,
):
    """Create and start a new POD workflow"""
    # 检查每日速率限制
    allowed, remaining = DailyRateLimiter.check_limit()
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"每日生成限制已达上限 ({DailyRateLimiter.MAX_DAILY_PRODUCTS} 个商品/天)。请明天再试。"
        )
    
    try:
        # 增加计数
        DailyRateLimiter.increment(request.num_designs)
        
        # Load config
        config = load_config_from_env()
        
        # Create workflow runner
        runner = create_pod_workflow(
            config=config.to_dict(),
            include_optimization=config.workflow.include_optimization,
            human_review=request.human_review,
        )
        
        # Generate workflow ID
        import uuid
        workflow_id = f"wf_{uuid.uuid4().hex[:12]}"
        thread_id = f"thread_{uuid.uuid4().hex[:12]}"
        
        # Create initial state
        initial_state = {
            "workflow_id": workflow_id,
            "thread_id": thread_id,
            "niche": request.niche,
            "style": request.style,
            "num_designs": request.num_designs,
            "target_platforms": request.target_platforms,
            "product_types": request.product_types,
            "status": WorkflowStatus.PENDING,
            "current_step": "queued",
            "retry_count": 0,
            "max_retries": 3,
            "human_review_required": request.human_review,
            "designs": [],
            "products": [],
            "listings": [],
            "errors": [],
            "total_cost": 0.0,
            "cost_breakdown": {},
            "started_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "completed_at": None,
        }
        
        # Store workflow
        _workflows[workflow_id] = initial_state
        _workflow_runners[workflow_id] = runner
        
        # Start workflow in background
        background_tasks.add_task(
            _run_workflow_async,
            workflow_id,
            runner,
            request.niche,
            request.style,
            request.num_designs,
            request.target_platforms,
            request.product_types,
        )
        
        logger.info(f"Created workflow {workflow_id} for niche: {request.niche}")
        
        return WorkflowCreateResponse(
            workflow_id=workflow_id,
            thread_id=thread_id,
            status=WorkflowStatus.PENDING,
            message=f"Workflow created and queued. Use GET /workflows/{workflow_id} to check status."
        )
        
    except Exception as e:
        logger.exception(f"Failed to create workflow: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "",
    response_model=WorkflowListResponse,
    summary="List all workflows",
    description="Get a list of all workflows with their current status."
)
async def list_workflows(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all workflows"""
    workflows = list(_workflows.values())
    
    # Filter by status if provided
    if status:
        workflows = [w for w in workflows if w.get("status") == status]
    
    # Sort by created time (newest first)
    workflows.sort(key=lambda w: w.get("started_at", ""), reverse=True)
    
    # Paginate
    total = len(workflows)
    workflows = workflows[offset:offset + limit]
    
    return WorkflowListResponse(
        workflows=[_state_to_response(w) for w in workflows],
        total=total,
    )


@router.get(
    "/{workflow_id}",
    response_model=WorkflowResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get workflow details",
    description="Get the current state and details of a specific workflow."
)
async def get_workflow(workflow_id: str):
    """Get workflow by ID"""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    return _state_to_response(_workflows[workflow_id])


@router.get(
    "/{workflow_id}/stream",
    summary="Stream workflow updates",
    description="Get real-time updates for a workflow using Server-Sent Events."
)
async def stream_workflow(workflow_id: str):
    """Stream workflow updates via SSE"""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    async def event_generator():
        last_step = None
        last_status = None
        
        while True:
            if workflow_id not in _workflows:
                yield {
                    "event": "error",
                    "data": WorkflowEventData(
                        event_type="error",
                        data={"message": "Workflow not found"}
                    ).model_dump_json()
                }
                break
            
            state = _workflows[workflow_id]
            current_step = state.get("current_step")
            current_status = state.get("status")
            
            # Send update if step or status changed
            if current_step != last_step or current_status != last_status:
                yield {
                    "event": "update",
                    "data": WorkflowEventData(
                        event_type="step_complete" if current_step != last_step else "status_change",
                        step=current_step,
                        data={
                            "status": current_status,
                            "designs_count": len(state.get("designs", [])),
                            "products_count": len(state.get("products", [])),
                            "listings_count": len(state.get("listings", [])),
                        }
                    ).model_dump_json()
                }
                last_step = current_step
                last_status = current_status
            
            # Check if workflow is complete
            if current_status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED]:
                yield {
                    "event": "done",
                    "data": WorkflowEventData(
                        event_type="done",
                        step=current_step,
                        data={"final_status": current_status}
                    ).model_dump_json()
                }
                break
            
            await asyncio.sleep(1)  # Poll interval
    
    return EventSourceResponse(event_generator())


@router.post(
    "/{workflow_id}/approve",
    response_model=WorkflowResponse,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
    summary="Approve or reject human review",
    description="Approve or reject a workflow that is paused for human review."
)
async def approve_workflow(
    workflow_id: str,
    request: WorkflowApproveRequest,
    background_tasks: BackgroundTasks,
):
    """Approve or reject human review and resume workflow"""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    state = _workflows[workflow_id]
    
    if not state.get("human_review_required"):
        raise HTTPException(status_code=400, detail="This workflow does not require human review")
    
    if state.get("status") != WorkflowStatus.PAUSED:
        raise HTTPException(status_code=400, detail=f"Workflow is not paused (current status: {state.get('status')})")
    
    # Update state
    state["human_review_approved"] = request.approved
    state["human_review_notes"] = request.notes
    state["updated_at"] = datetime.now().isoformat()
    
    if not request.approved:
        state["status"] = WorkflowStatus.FAILED
        state["completed_at"] = datetime.now().isoformat()
        logger.info(f"Workflow {workflow_id} rejected by human review")
    else:
        # Resume workflow
        runner = _workflow_runners.get(workflow_id)
        if runner:
            state["status"] = WorkflowStatus.RUNNING
            # Resume in background
            loop = asyncio.get_event_loop()
            background_tasks.add_task(
                lambda: loop.run_in_executor(
                    None,
                    lambda: runner.resume(
                        thread_id=state["thread_id"],
                        updates={"human_review_approved": True}
                    )
                )
            )
            logger.info(f"Workflow {workflow_id} approved and resumed")
    
    return _state_to_response(state)


@router.delete(
    "/{workflow_id}",
    responses={404: {"model": ErrorResponse}},
    summary="Delete a workflow",
    description="Delete a workflow and its data."
)
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    del _workflows[workflow_id]
    if workflow_id in _workflow_runners:
        del _workflow_runners[workflow_id]
    
    logger.info(f"Deleted workflow {workflow_id}")
    
    return {"message": f"Workflow {workflow_id} deleted"}
