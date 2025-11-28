"""
SEO优化Agent (SEOOptimizationAgent)
生成优化的产品标题、描述和标签

职责：
1. 为每个设计生成SEO优化的标题
2. 创建吸引人的产品描述
3. 生成相关标签和关键词
4. 针对不同平台优化内容
"""

import json
from typing import Dict, Any, List
from datetime import datetime

from core.base_agent import LLMAgent, AgentError
from core.state import PODState, DesignData, SEOData


class SEOOptimizationAgent(LLMAgent):
    """
    SEO优化Agent
    
    使用Claude生成SEO内容，特点：
    1. 平台特定优化（Etsy, Amazon等）
    2. 关键词密度控制
    3. 多语言支持（可选）
    """
    
    # 平台特定的SEO规则
    PLATFORM_RULES = {
        "etsy": {
            "title_max_length": 140,
            "description_max_length": 10000,
            "tags_count": 13,
            "tag_max_length": 20
        },
        "amazon": {
            "title_max_length": 200,
            "description_max_length": 2000,
            "tags_count": 5,
            "tag_max_length": 50
        },
        "shopify": {
            "title_max_length": 255,
            "description_max_length": 5000,
            "tags_count": 15,
            "tag_max_length": 30
        }
    }
    
    @property
    def name(self) -> str:
        return "seo_optimization"
    
    def _validate_preconditions(self, state: PODState):
        """验证前置条件"""
        if not state.get("products"):
            raise AgentError(
                self.name,
                "No products available. Run mockup_creation first.",
                recoverable=False
            )
    
    async def process(self, state: PODState) -> Dict[str, Any]:
        """
        生成SEO优化内容
        
        输入：products, designs, trend_data, target_platforms
        输出：seo_content
        """
        products = state["products"]
        designs = state["designs"]
        trend_data = state.get("trend_data", {})
        platforms = state.get("target_platforms", ["etsy"])
        niche = state["niche"]
        
        # 创建设计ID到设计的映射
        design_map = {d["design_id"]: d for d in designs}
        
        self.logger.info(f"Generating SEO content for {len(products)} products")
        
        seo_content = []
        
        # 按设计分组产品
        design_products = {}
        for product in products:
            design_id = product["design_id"]
            if design_id not in design_products:
                design_products[design_id] = []
            design_products[design_id].append(product)
        
        # 为每个设计生成SEO内容
        for design_id, prods in design_products.items():
            design = design_map.get(design_id)
            if not design:
                continue
            
            seo = await self._generate_seo_content(
                design=design,
                products=prods,
                trend_data=trend_data,
                niche=niche,
                platforms=platforms
            )
            seo_content.append(seo)
        
        # 计算LLM成本
        llm_cost = len(design_products) * 0.01  # 估算每次调用成本
        cost_breakdown = state.get("cost_breakdown", {}).copy()
        cost_breakdown["anthropic"] = cost_breakdown.get("anthropic", 0) + llm_cost
        
        self.logger.info(f"Generated SEO content for {len(seo_content)} designs")
        
        return {
            "seo_content": seo_content,
            "total_cost": state["total_cost"] + llm_cost,
            "cost_breakdown": cost_breakdown,
            "current_step": "seo_optimization_complete"
        }
    
    async def _generate_seo_content(
        self,
        design: DesignData,
        products: List[Dict],
        trend_data: Dict,
        niche: str,
        platforms: List[str]
    ) -> SEOData:
        """为单个设计生成SEO内容"""
        
        # 获取主要平台的规则
        primary_platform = platforms[0] if platforms else "etsy"
        rules = self.PLATFORM_RULES.get(primary_platform, self.PLATFORM_RULES["etsy"])
        
        # 构建提示词
        prompt = self._build_seo_prompt(design, products, trend_data, niche, rules)
        
        # 调用LLM
        response = await self.invoke_llm(prompt)
        
        # 解析响应
        seo_data = self._parse_seo_response(response, design["design_id"], rules)
        
        return seo_data
    
    def _build_seo_prompt(
        self,
        design: DesignData,
        products: List[Dict],
        trend_data: Dict,
        niche: str,
        rules: Dict
    ) -> str:
        """构建SEO优化提示词"""
        keywords = design.get("keywords", [])
        trend_keywords = trend_data.get("keywords", [])
        product_types = [p["product_type"] for p in products]
        
        return f"""作为POD电商SEO专家，为以下设计创建优化的产品listing内容。

设计信息：
- 提示词：{design.get('prompt', '')}
- 风格：{design.get('style', '')}
- 关键词：{', '.join(keywords)}

市场信息：
- 利基市场：{niche}
- 趋势关键词：{', '.join(trend_keywords[:10])}
- 产品类型：{', '.join(product_types)}

SEO规则：
- 标题最大长度：{rules['title_max_length']}字符
- 描述最大长度：{rules['description_max_length']}字符
- 标签数量：{rules['tags_count']}个
- 单个标签最大长度：{rules['tag_max_length']}字符

任务：
1. 创建一个吸引人的产品标题
   - 包含主要关键词
   - 突出卖点
   - 适合目标受众

2. 编写详细的产品描述
   - 开头吸引注意力
   - 描述产品特点和用途
   - 包含关键词但自然流畅
   - 包含购买理由

3. 生成{rules['tags_count']}个相关标签
   - 混合长尾关键词和热门词
   - 每个标签不超过{rules['tag_max_length']}字符

请严格按照以下JSON格式返回：
{{
    "title": "产品标题",
    "description": "产品描述",
    "tags": ["标签1", "标签2", ...],
    "keywords": ["关键词1", "关键词2", ...]
}}

只返回JSON，不要添加任何其他文字。"""

    def _parse_seo_response(
        self, 
        response: str, 
        design_id: str,
        rules: Dict
    ) -> SEOData:
        """解析LLM响应并验证"""
        try:
            # 清理响应
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            clean_response = clean_response.strip()
            
            data = json.loads(clean_response)
            
            # 验证和截断
            title = data.get("title", "")[:rules["title_max_length"]]
            description = data.get("description", "")[:rules["description_max_length"]]
            tags = data.get("tags", [])[:rules["tags_count"]]
            tags = [t[:rules["tag_max_length"]] for t in tags]
            keywords = data.get("keywords", [])
            
            return SEOData(
                design_id=design_id,
                title=title,
                description=description,
                tags=tags,
                keywords=keywords,
                optimized_at=datetime.now().isoformat()
            )
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse SEO response: {e}")
            # 返回默认内容
            return SEOData(
                design_id=design_id,
                title=f"Beautiful {design_id} Design",
                description="A unique and beautiful design for you.",
                tags=["design", "unique", "gift"],
                keywords=["design", "unique"],
                optimized_at=datetime.now().isoformat()
            )


def create_seo_optimization_node(config: Dict[str, Any] = None):
    """创建SEO优化节点"""
    agent = SEOOptimizationAgent(config=config)
    
    def node(state: PODState) -> Dict:
        import asyncio
        return asyncio.run(agent(state))
    
    return node
