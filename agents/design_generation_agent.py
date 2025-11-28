"""
设计生成Agent (DesignGenerationAgent)
使用DALL-E 3生成POD产品设计图

职责：
1. 根据设计提示词生成高质量图片
2. 确保图片适合POD产品打印
3. 管理生成成本和质量
"""

import uuid
import asyncio
from typing import Dict, Any, List
from datetime import datetime

from core.base_agent import BaseAgent, AgentError, with_retry
from core.state import PODState, DesignData


class DesignGenerationAgent(BaseAgent):
    """
    设计生成Agent
    
    使用DALL-E 3生成设计图，特点：
    1. 高质量图像生成
    2. 支持批量生成
    3. 成本追踪
    4. 并发控制
    """
    
    DALLE_COST_PER_IMAGE = 0.04  # DALL-E 3 1024x1024 价格
    MAX_CONCURRENT_REQUESTS = 3  # 并发限制
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self._openai_client = None
    
    @property
    def name(self) -> str:
        return "design_generation"
    
    @property
    def openai_client(self):
        """延迟初始化OpenAI客户端"""
        if self._openai_client is None:
            try:
                from openai import AsyncOpenAI
                self._openai_client = AsyncOpenAI(
                    api_key=self.config.get("openai_api_key")
                )
            except ImportError:
                self.logger.warning("openai not installed, using mock client")
        return self._openai_client
    
    def _validate_preconditions(self, state: PODState):
        """验证前置条件"""
        if not state.get("design_prompts"):
            raise AgentError(
                self.name, 
                "No design prompts available. Run trend_analysis first.",
                recoverable=False
            )
    
    async def process(self, state: PODState) -> Dict[str, Any]:
        """
        生成设计图
        
        输入：design_prompts, style, niche
        输出：designs, total_cost更新
        """
        prompts = state["design_prompts"]
        style = state["style"]
        niche = state["niche"]
        
        self.logger.info(f"Generating {len(prompts)} designs...")
        
        # 并发生成设计
        designs = await self._generate_designs_batch(prompts, style, niche)
        
        # 计算成本
        generation_cost = len(designs) * self.DALLE_COST_PER_IMAGE
        
        self.logger.info(f"Generated {len(designs)} designs, cost: ${generation_cost:.2f}")
        
        # 更新成本
        cost_breakdown = state.get("cost_breakdown", {}).copy()
        cost_breakdown["dalle"] = cost_breakdown.get("dalle", 0) + generation_cost
        
        return {
            "designs": designs,
            "total_cost": state["total_cost"] + generation_cost,
            "cost_breakdown": cost_breakdown,
            "current_step": "design_generation_complete"
        }
    
    async def _generate_designs_batch(
        self, 
        prompts: List[str], 
        style: str, 
        niche: str
    ) -> List[DesignData]:
        """批量生成设计，带并发控制"""
        semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_REQUESTS)
        
        async def generate_with_semaphore(prompt: str, index: int) -> DesignData:
            async with semaphore:
                return await self._generate_single_design(prompt, style, niche, index)
        
        tasks = [
            generate_with_semaphore(prompt, i) 
            for i, prompt in enumerate(prompts)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 过滤掉失败的结果
        designs = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Failed to generate design {i}: {result}")
            elif result is not None:
                designs.append(result)
        
        return designs
    
    @with_retry(max_retries=2, delay=2.0, backoff=2.0)
    async def _generate_single_design(
        self, 
        prompt: str, 
        style: str, 
        niche: str,
        index: int
    ) -> DesignData:
        """生成单个设计"""
        design_id = f"design_{uuid.uuid4().hex[:12]}"
        
        # 增强提示词，确保适合POD打印
        enhanced_prompt = self._enhance_prompt(prompt, style)
        
        # 调用DALL-E API
        image_url = await self._call_dalle_api(enhanced_prompt)
        
        # 从趋势分析的prompt中提取关键词
        keywords = self._extract_keywords(prompt, niche)
        
        return DesignData(
            design_id=design_id,
            prompt=enhanced_prompt,
            image_url=image_url,
            style=style,
            keywords=keywords,
            created_at=datetime.now().isoformat(),
            quality_score=None,  # 将由质量检查Agent填充
            quality_issues=None
        )
    
    def _enhance_prompt(self, prompt: str, style: str) -> str:
        """增强提示词，确保生成适合POD的图像"""
        enhancement = """
High quality, detailed illustration. Clean design with transparent or solid 
background, suitable for print-on-demand products like t-shirts and mugs. 
No text or watermarks. Vector-style clean edges. 
Professional quality, ready for commercial use."""
        
        return f"{prompt} {enhancement}"
    
    async def _call_dalle_api(self, prompt: str) -> str:
        """调用DALL-E API"""
        if self.openai_client is None:
            # Mock响应
            return f"https://example.com/mock_image_{uuid.uuid4().hex[:8]}.png"
        
        try:
            response = await self.openai_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            return response.data[0].url
        except Exception as e:
            self.logger.error(f"DALL-E API error: {e}")
            raise AgentError(self.name, f"DALL-E generation failed: {e}")
    
    def _extract_keywords(self, prompt: str, niche: str) -> List[str]:
        """从提示词中提取关键词"""
        # 简单的关键词提取
        words = prompt.lower().split()
        # 过滤常用词
        stop_words = {'a', 'an', 'the', 'for', 'in', 'on', 'with', 'and', 'or', 'of'}
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        
        # 确保包含niche
        if niche.lower() not in [k.lower() for k in keywords]:
            keywords.insert(0, niche)
        
        return keywords[:10]  # 最多10个关键词


# 便捷方法
def create_design_generation_node(config: Dict[str, Any] = None):
    """创建设计生成节点"""
    agent = DesignGenerationAgent(config=config)
    
    def node(state: PODState) -> Dict:
        import asyncio
        return asyncio.run(agent(state))
    
    return node
