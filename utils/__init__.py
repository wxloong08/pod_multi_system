"""
POD多智能体系统 - 工具模块
"""

import uuid
from datetime import datetime
from typing import Dict, Any


def generate_id(prefix: str = "") -> str:
    """生成唯一ID"""
    return f"{prefix}_{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex[:12]


def get_timestamp() -> str:
    """获取当前时间戳（ISO格式）"""
    return datetime.now().isoformat()


def safe_json_loads(text: str, default: Any = None) -> Any:
    """安全的JSON解析"""
    import json
    try:
        # 清理可能的markdown代码块
        clean_text = text.strip()
        if clean_text.startswith("```"):
            parts = clean_text.split("```")
            if len(parts) >= 2:
                clean_text = parts[1]
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:]
        clean_text = clean_text.strip()
        return json.loads(clean_text)
    except json.JSONDecodeError:
        return default


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """截断文本"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def merge_dicts(base: Dict, updates: Dict) -> Dict:
    """深度合并字典"""
    result = base.copy()
    for key, value in updates.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    return result


__all__ = [
    "generate_id",
    "get_timestamp",
    "safe_json_loads",
    "truncate_text",
    "merge_dicts"
]
