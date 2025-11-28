"""
POD多智能体系统 - Agents模块

8个专业化Agent：
1. TrendAnalysisAgent - 趋势分析（Claude 3.5 Sonnet）
2. DesignGenerationAgent - 设计生成（DALL-E 3）
3. QualityCheckAgent - 质量检查（规则引擎 + LLM）
4. MockupCreationAgent - 产品合成（Printful API）
5. SEOOptimizationAgent - SEO优化（Claude）
6. PlatformUploadAgent - 平台上传（Etsy/Amazon API）
7. OptimizationAgent - 优化建议（Claude）
"""

from agents.trend_analysis_agent import (
    TrendAnalysisAgent,
    create_trend_analysis_node
)

from agents.design_generation_agent import (
    DesignGenerationAgent,
    create_design_generation_node
)

from agents.quality_check_agent import (
    QualityCheckAgent,
    create_quality_check_node,
    route_quality_check
)

from agents.mockup_creation_agent import (
    MockupCreationAgent,
    create_mockup_creation_node
)

from agents.seo_optimization_agent import (
    SEOOptimizationAgent,
    create_seo_optimization_node
)

from agents.platform_upload_agent import (
    PlatformUploadAgent,
    create_platform_upload_node
)

from agents.optimization_agent import (
    OptimizationAgent,
    create_optimization_node
)


__all__ = [
    # Agent类
    "TrendAnalysisAgent",
    "DesignGenerationAgent", 
    "QualityCheckAgent",
    "MockupCreationAgent",
    "SEOOptimizationAgent",
    "PlatformUploadAgent",
    "OptimizationAgent",
    
    # 节点创建函数
    "create_trend_analysis_node",
    "create_design_generation_node",
    "create_quality_check_node",
    "create_mockup_creation_node",
    "create_seo_optimization_node",
    "create_platform_upload_node",
    "create_optimization_node",
    
    # 路由函数
    "route_quality_check",
]
