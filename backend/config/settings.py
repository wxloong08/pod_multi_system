"""
POD多智能体系统 - 配置管理

支持：
1. 环境变量加载
2. 配置验证
3. 默认值设置
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class APIConfig:
    """API配置"""
    # Yunwu.ai 中转API配置（推荐使用）
    yunwu_api_key: Optional[str] = None
    yunwu_api_base: str = "https://yunwu.ai/v1"
    
    # 原始API配置（作为后备选项）
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    printful_api_key: Optional[str] = None
    etsy_api_key: Optional[str] = None
    etsy_shop_id: Optional[str] = None


@dataclass
class WorkflowConfig:
    """工作流配置"""
    max_retries: int = 3
    quality_threshold: float = 0.8
    human_review_required: bool = False
    include_optimization: bool = False  # 优化节点用于周期性评估，不在主工作流中执行
    
    # 默认产品配置
    default_platforms: list = field(default_factory=lambda: ["etsy"])
    default_product_types: list = field(default_factory=lambda: ["t-shirt", "mug"])
    default_num_designs: int = 5


@dataclass 
class DatabaseConfig:
    """数据库配置（用于Checkpoint持久化）"""
    database_url: Optional[str] = None
    redis_url: Optional[str] = None


@dataclass
class PODConfig:
    """完整的POD系统配置"""
    api: APIConfig = field(default_factory=APIConfig)
    workflow: WorkflowConfig = field(default_factory=WorkflowConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "yunwu_api_key": self.api.yunwu_api_key,
            "yunwu_api_base": self.api.yunwu_api_base,
            "openai_api_key": self.api.openai_api_key,
            "anthropic_api_key": self.api.anthropic_api_key,
            "printful_api_key": self.api.printful_api_key,
            "etsy_api_key": self.api.etsy_api_key,
            "etsy_shop_id": self.api.etsy_shop_id,
            "database_url": self.database.database_url,
            "redis_url": self.database.redis_url,
            "max_retries": self.workflow.max_retries,
            "quality_threshold": self.workflow.quality_threshold,
        }


def load_config_from_env() -> PODConfig:
    """从环境变量加载配置"""
    # 尝试加载.env文件
    try:
        from dotenv import load_dotenv
        env_path = Path(".env")
        if env_path.exists():
            load_dotenv(env_path)
    except ImportError:
        pass
    
    return PODConfig(
        api=APIConfig(
            yunwu_api_key=os.getenv("YUNWU_API_KEY"),
            yunwu_api_base=os.getenv("YUNWU_API_BASE", "https://yunwu.ai/v1"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            printful_api_key=os.getenv("PRINTFUL_API_KEY"),
            etsy_api_key=os.getenv("ETSY_API_KEY"),
            etsy_shop_id=os.getenv("ETSY_SHOP_ID"),
        ),
        workflow=WorkflowConfig(
            max_retries=int(os.getenv("MAX_RETRIES", "3")),
            quality_threshold=float(os.getenv("QUALITY_THRESHOLD", "0.8")),
            human_review_required=os.getenv("HUMAN_REVIEW", "false").lower() == "true",
            include_optimization=os.getenv("INCLUDE_OPTIMIZATION", "false").lower() == "true",
        ),
        database=DatabaseConfig(
            database_url=os.getenv("DATABASE_URL"),
            redis_url=os.getenv("REDIS_URL"),
        )
    )


def validate_config(config: PODConfig) -> tuple:
    """
    验证配置
    
    Returns:
        (is_valid, warnings, errors)
    """
    warnings = []
    errors = []
    
    # 检查必要的API密钥（优先检查yunwu，其次检查原始key）
    if not config.api.yunwu_api_key and not config.api.openai_api_key:
        warnings.append("Neither Yunwu nor OpenAI API key set - design generation will use mock data")
    
    if not config.api.yunwu_api_key and not config.api.anthropic_api_key:
        warnings.append("Neither Yunwu nor Anthropic API key set - trend analysis will use mock data")
    
    if not config.api.printful_api_key:
        warnings.append("Printful API key not set - mockup creation will use mock data")
    
    # 检查工作流配置
    if config.workflow.max_retries < 1:
        errors.append("max_retries must be at least 1")
    
    if not 0 < config.workflow.quality_threshold <= 1:
        errors.append("quality_threshold must be between 0 and 1")
    
    is_valid = len(errors) == 0
    return is_valid, warnings, errors


# 全局配置实例
_config: Optional[PODConfig] = None


def get_config() -> PODConfig:
    """获取全局配置"""
    global _config
    if _config is None:
        _config = load_config_from_env()
    return _config


def set_config(config: PODConfig):
    """设置全局配置"""
    global _config
    _config = config
