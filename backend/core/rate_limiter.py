"""
POD 系统 - 每日速率限制器

限制每天生成的商品数量，防止被盗刷导致不必要的成本
演示项目默认限制：每天 5 个商品
"""

from datetime import date
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class DailyRateLimiter:
    """每日速率限制器
    
    单例模式，跨请求保持计数
    """
    
    # 默认每日限制
    MAX_DAILY_PRODUCTS = 5
    
    # 内存存储（生产环境应使用 Redis）
    _daily_counts: dict = {}
    _current_date: str = ""
    
    @classmethod
    def check_limit(cls) -> Tuple[bool, int]:
        """检查是否超过每日限制
        
        Returns:
            (allowed, remaining): 是否允许继续, 剩余配额
        """
        today = date.today().isoformat()
        
        # 日期变化时重置计数
        if today != cls._current_date:
            cls._daily_counts = {}
            cls._current_date = today
            logger.info(f"Daily rate limit reset for {today}")
        
        count = cls._daily_counts.get("global", 0)
        remaining = cls.MAX_DAILY_PRODUCTS - count
        allowed = remaining > 0
        
        if not allowed:
            logger.warning(f"Daily rate limit exceeded: {count}/{cls.MAX_DAILY_PRODUCTS}")
        
        return allowed, remaining
    
    @classmethod
    def increment(cls, count: int = 1) -> int:
        """增加计数
        
        Args:
            count: 增加的数量
            
        Returns:
            当前总计数
        """
        today = date.today().isoformat()
        
        # 日期变化时重置
        if today != cls._current_date:
            cls._daily_counts = {}
            cls._current_date = today
        
        current = cls._daily_counts.get("global", 0)
        new_count = current + count
        cls._daily_counts["global"] = new_count
        
        logger.info(f"Rate limit count: {new_count}/{cls.MAX_DAILY_PRODUCTS}")
        return new_count
    
    @classmethod
    def get_status(cls) -> dict:
        """获取当前限制状态
        
        Returns:
            状态字典
        """
        today = date.today().isoformat()
        
        if today != cls._current_date:
            return {
                "date": today,
                "used": 0,
                "remaining": cls.MAX_DAILY_PRODUCTS,
                "limit": cls.MAX_DAILY_PRODUCTS
            }
        
        used = cls._daily_counts.get("global", 0)
        return {
            "date": today,
            "used": used,
            "remaining": max(0, cls.MAX_DAILY_PRODUCTS - used),
            "limit": cls.MAX_DAILY_PRODUCTS
        }
