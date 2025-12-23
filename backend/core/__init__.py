"""
POD多智能体系统 - Core模块

核心组件：
1. state - 状态定义和管理
2. workflow - 工作流编排
3. base_agent - Agent基类
"""

from core.state import (
    PODState,
    WorkflowStatus,
    QualityResult,
    DesignData,
    ProductData,
    SEOData,
    ListingData,
    SalesMetrics,
    TrendData,
    create_initial_state,
    update_cost,
    add_error
)

from core.workflow import (
    PODWorkflowBuilder,
    PODWorkflowRunner,
    create_pod_workflow,
    WORKFLOW_MERMAID
)

from core.base_agent import (
    BaseAgent,
    LLMAgent,
    ToolAgent,
    AgentError,
    with_retry,
    create_agent_node
)


__all__ = [
    # 状态
    "PODState",
    "WorkflowStatus",
    "QualityResult",
    "DesignData",
    "ProductData",
    "SEOData",
    "ListingData",
    "SalesMetrics",
    "TrendData",
    "create_initial_state",
    "update_cost",
    "add_error",
    
    # 工作流
    "PODWorkflowBuilder",
    "PODWorkflowRunner",
    "create_pod_workflow",
    "WORKFLOW_MERMAID",
    
    # Agent基类
    "BaseAgent",
    "LLMAgent",
    "ToolAgent",
    "AgentError",
    "with_retry",
    "create_agent_node",
]
