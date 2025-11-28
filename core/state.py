"""
POD多智能体系统 - 状态定义
基于LangGraph的TypedDict状态管理

状态设计原则：
1. 类型安全：使用TypedDict确保字段类型
2. 分层设计：输入参数层、处理结果层、元数据层分离
3. 列表累加：使用Annotated[List, operator.add]实现列表合并
4. 最小化：只保存必要信息，大对象存储URL而非二进制
"""

import operator
from typing import TypedDict, List, Dict, Optional, Annotated
from datetime import datetime
from enum import Enum


class WorkflowStatus(str, Enum):
    """工作流状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"          # Human-in-the-loop暂停
    COMPLETED = "completed"
    FAILED = "failed"


class QualityResult(str, Enum):
    """质量检查结果"""
    PASS = "pass"
    RETRY = "retry"
    FAIL = "fail"


class DesignData(TypedDict):
    """单个设计数据结构"""
    design_id: str
    prompt: str
    image_url: str
    style: str
    keywords: List[str]
    created_at: str
    quality_score: Optional[float]
    quality_issues: Optional[List[str]]


class ProductData(TypedDict):
    """单个产品数据结构"""
    product_id: str
    design_id: str
    mockup_url: str
    product_type: str           # t-shirt, mug, poster等
    variant_ids: List[str]
    printful_sync_id: Optional[str]
    created_at: str


class SEOData(TypedDict):
    """SEO优化数据"""
    design_id: str
    title: str
    description: str
    tags: List[str]
    keywords: List[str]
    optimized_at: str


class ListingData(TypedDict):
    """上架记录数据"""
    listing_id: str
    design_id: str
    platform: str               # etsy, amazon, shopify等
    listing_url: str
    status: str
    listed_at: str


class SalesMetrics(TypedDict):
    """销售数据指标"""
    design_id: str
    views: int
    favorites: int
    sales: int
    revenue: float
    conversion_rate: float
    updated_at: str


class TrendData(TypedDict):
    """趋势分析数据"""
    sub_topics: List[str]
    keywords: List[str]
    audience: Dict[str, str]
    competition_level: str      # low, medium, high
    seasonal_trends: Optional[List[str]]
    recommended_styles: List[str]
    analyzed_at: str


class PODState(TypedDict):
    """
    POD工作流的全局状态
    
    分为三层：
    1. 输入参数层 - 用户输入的原始参数
    2. 处理结果层 - 各Agent生成的中间和最终数据
    3. 元数据层 - 工作流控制和追踪信息
    """
    
    # ========== 输入参数层 ==========
    # 用户在启动工作流时提供的参数
    
    niche: str                              # 利基市场，如 "cat lovers", "fitness"
    style: str                              # 设计风格，如 "minimalist", "vintage"
    num_designs: int                        # 要生成的设计数量
    target_platforms: List[str]             # 目标平台，如 ["etsy", "amazon"]
    product_types: List[str]                # 产品类型，如 ["t-shirt", "mug"]
    
    # ========== 处理结果层 ==========
    # 各Agent处理后的结果，使用Annotated实现列表累加
    
    # 趋势分析结果
    trend_data: Optional[TrendData]
    
    # 设计提示词列表（趋势分析后生成）
    design_prompts: Annotated[List[str], operator.add]
    
    # 生成的设计列表（支持累加，多次生成的设计会合并）
    designs: Annotated[List[DesignData], operator.add]
    
    # 合成的产品列表
    products: Annotated[List[ProductData], operator.add]
    
    # SEO优化内容
    seo_content: Annotated[List[SEOData], operator.add]
    
    # 上架记录
    listings: Annotated[List[ListingData], operator.add]
    
    # 销售数据（优化Agent使用）
    sales_data: Optional[List[SalesMetrics]]
    
    # 优化建议
    optimization_recommendations: Optional[Dict[str, List[str]]]
    
    # ========== 元数据层 ==========
    # 工作流控制和追踪信息
    
    # 工作流标识
    workflow_id: str
    thread_id: str                          # LangGraph thread标识
    
    # 当前状态
    current_step: str                       # 当前执行的节点名
    status: WorkflowStatus
    
    # 重试控制
    retry_count: int                        # 当前重试次数
    max_retries: int                        # 最大重试次数（默认3）
    
    # 质量检查
    quality_check_result: Optional[QualityResult]
    failed_design_ids: Annotated[List[str], operator.add]
    
    # 人工审核
    human_review_required: bool
    human_review_approved: Optional[bool]
    human_review_notes: Optional[str]
    
    # 错误追踪
    errors: Annotated[List[Dict[str, str]], operator.add]
    
    # 成本追踪
    total_cost: float                       # 总API成本
    cost_breakdown: Dict[str, float]        # 各服务成本明细
    
    # 时间追踪
    started_at: str
    updated_at: str
    completed_at: Optional[str]


def create_initial_state(
    niche: str,
    style: str,
    num_designs: int = 5,
    target_platforms: Optional[List[str]] = None,
    product_types: Optional[List[str]] = None,
    workflow_id: Optional[str] = None,
    thread_id: Optional[str] = None,
    max_retries: int = 3
) -> PODState:
    """
    创建初始状态
    
    Args:
        niche: 利基市场
        style: 设计风格
        num_designs: 设计数量
        target_platforms: 目标平台列表
        product_types: 产品类型列表
        workflow_id: 工作流ID（可选，自动生成）
        thread_id: 线程ID（可选，自动生成）
        max_retries: 最大重试次数
    
    Returns:
        初始化的PODState
    """
    import uuid
    
    now = datetime.now().isoformat()
    
    return PODState(
        # 输入参数
        niche=niche,
        style=style,
        num_designs=num_designs,
        target_platforms=target_platforms or ["etsy"],
        product_types=product_types or ["t-shirt", "mug"],
        
        # 处理结果（初始为空）
        trend_data=None,
        design_prompts=[],
        designs=[],
        products=[],
        seo_content=[],
        listings=[],
        sales_data=None,
        optimization_recommendations=None,
        
        # 元数据
        workflow_id=workflow_id or f"wf_{uuid.uuid4().hex[:12]}",
        thread_id=thread_id or f"thread_{uuid.uuid4().hex[:12]}",
        current_step="initialized",
        status=WorkflowStatus.PENDING,
        retry_count=0,
        max_retries=max_retries,
        quality_check_result=None,
        failed_design_ids=[],
        human_review_required=False,
        human_review_approved=None,
        human_review_notes=None,
        errors=[],
        total_cost=0.0,
        cost_breakdown={},
        started_at=now,
        updated_at=now,
        completed_at=None
    )


def update_cost(state: PODState, service: str, cost: float) -> Dict:
    """
    更新成本追踪
    
    Args:
        state: 当前状态
        service: 服务名称（如 "openai", "anthropic", "dalle"）
        cost: 本次成本
    
    Returns:
        需要更新的状态字段
    """
    current_breakdown = state.get("cost_breakdown", {}).copy()
    current_breakdown[service] = current_breakdown.get(service, 0) + cost
    
    return {
        "total_cost": state["total_cost"] + cost,
        "cost_breakdown": current_breakdown,
        "updated_at": datetime.now().isoformat()
    }


def add_error(state: PODState, step: str, error_type: str, message: str) -> Dict:
    """
    添加错误记录
    
    Args:
        state: 当前状态
        step: 发生错误的步骤
        error_type: 错误类型
        message: 错误信息
    
    Returns:
        需要更新的状态字段
    """
    error = {
        "step": step,
        "error_type": error_type,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "errors": [error],  # 会通过operator.add累加
        "updated_at": datetime.now().isoformat()
    }
