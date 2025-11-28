"""
POD多智能体系统 - 主入口

使用方法：
1. 命令行运行：
   python main.py --niche "cat lovers" --style "minimalist" --designs 5

2. 作为模块导入：
   from main import run_pod_workflow
   result = run_pod_workflow("cat lovers", "minimalist", 5)

3. 演示模式：
   python main.py --demo
"""

import sys
import os
import json
import logging
import argparse
from datetime import datetime
from typing import Dict, Any, Optional

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import load_config_from_env, validate_config, PODConfig
from core import create_pod_workflow, PODState, WORKFLOW_MERMAID

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('pod_workflow.log')
    ]
)
logger = logging.getLogger(__name__)


def run_pod_workflow(
    niche: str,
    style: str,
    num_designs: int = 5,
    target_platforms: Optional[list] = None,
    product_types: Optional[list] = None,
    config: Optional[PODConfig] = None,
    human_review: bool = False
) -> Dict[str, Any]:
    """
    运行POD工作流
    
    Args:
        niche: 利基市场（如 "cat lovers", "fitness", "gaming"）
        style: 设计风格（如 "minimalist", "vintage", "cartoon"）
        num_designs: 要生成的设计数量
        target_platforms: 目标平台列表
        product_types: 产品类型列表
        config: 配置对象（默认从环境变量加载）
        human_review: 是否需要人工审核
    
    Returns:
        工作流最终状态
    """
    # 加载配置
    if config is None:
        config = load_config_from_env()
    
    # 验证配置
    is_valid, warnings, errors = validate_config(config)
    
    for warning in warnings:
        logger.warning(warning)
    
    if not is_valid:
        for error in errors:
            logger.error(error)
        raise ValueError(f"Invalid configuration: {errors}")
    
    # 创建工作流
    logger.info(f"Creating POD workflow for niche: {niche}, style: {style}")
    
    runner = create_pod_workflow(
        config=config.to_dict(),
        include_optimization=config.workflow.include_optimization,
        human_review=human_review
    )
    
    # 运行工作流
    logger.info("Starting workflow execution...")
    start_time = datetime.now()
    
    try:
        result = runner.run(
            niche=niche,
            style=style,
            num_designs=num_designs,
            target_platforms=target_platforms or config.workflow.default_platforms,
            product_types=product_types or config.workflow.default_product_types
        )
        
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"Workflow completed in {elapsed:.2f} seconds")
        
        # 打印结果摘要
        print_result_summary(result)
        
        return result
        
    except Exception as e:
        logger.exception(f"Workflow failed: {e}")
        raise


def print_result_summary(result: Dict[str, Any]):
    """打印结果摘要"""
    print("\n" + "=" * 60)
    print("POD Workflow Results Summary")
    print("=" * 60)
    
    if result is None:
        print("No results available")
        return
    
    # 基本信息
    print(f"\nWorkflow ID: {result.get('workflow_id', 'N/A')}")
    print(f"Status: {result.get('status', 'N/A')}")
    print(f"Niche: {result.get('niche', 'N/A')}")
    print(f"Style: {result.get('style', 'N/A')}")
    
    # 生成的设计
    designs = result.get('designs', [])
    print(f"\nDesigns Generated: {len(designs)}")
    for i, design in enumerate(designs[:3], 1):
        score = design.get('quality_score', 0)
        print(f"  {i}. {design.get('design_id', 'N/A')} - Score: {score:.2f}")
    if len(designs) > 3:
        print(f"  ... and {len(designs) - 3} more")
    
    # 产品
    products = result.get('products', [])
    print(f"\nProducts Created: {len(products)}")
    
    # Listings
    listings = result.get('listings', [])
    print(f"Listings Published: {len(listings)}")
    for listing in listings[:3]:
        print(f"  - {listing.get('platform', 'N/A')}: {listing.get('listing_url', 'N/A')}")
    
    # 成本
    print(f"\nTotal Cost: ${result.get('total_cost', 0):.2f}")
    breakdown = result.get('cost_breakdown', {})
    for service, cost in breakdown.items():
        print(f"  - {service}: ${cost:.2f}")
    
    # 错误
    errors = result.get('errors', [])
    if errors:
        print(f"\nErrors: {len(errors)}")
        for error in errors[:3]:
            print(f"  - [{error.get('step')}] {error.get('message')}")
    
    # 优化建议
    recommendations = result.get('optimization_recommendations', {})
    if recommendations:
        print("\nTop Optimization Recommendations:")
        for action in recommendations.get('priority_actions', [])[:3]:
            print(f"  • {action}")
    
    print("\n" + "=" * 60)


def run_demo():
    """运行演示模式"""
    print("\n" + "=" * 60)
    print("POD Multi-Agent System Demo")
    print("=" * 60)
    
    print("\n📋 System Architecture:")
    print(WORKFLOW_MERMAID)
    
    print("\n🤖 8 Specialized Agents:")
    agents = [
        ("1. TrendAnalysisAgent", "Claude 3.5 Sonnet", "Market trend analysis"),
        ("2. DesignGenerationAgent", "DALL-E 3", "Design image generation"),
        ("3. QualityCheckAgent", "Rules + LLM", "Quality validation"),
        ("4. MockupCreationAgent", "Printful API", "Product mockup creation"),
        ("5. SEOOptimizationAgent", "Claude", "SEO content optimization"),
        ("6. PlatformUploadAgent", "Etsy/Amazon API", "Platform publishing"),
        ("7. OptimizationAgent", "Claude", "Performance analysis"),
    ]
    
    for name, tech, desc in agents:
        print(f"  {name}")
        print(f"     Tech: {tech}")
        print(f"     Role: {desc}")
    
    print("\n🔧 Key Features:")
    features = [
        "✅ StateGraph-based workflow orchestration",
        "✅ Checkpoint persistence (MemorySaver/PostgresSaver)",
        "✅ Quality check loop with retry mechanism",
        "✅ Human-in-the-loop support (interrupt_before)",
        "✅ Exponential backoff retry strategy",
        "✅ Cost tracking and optimization",
        "✅ Multi-platform support (Etsy, Amazon, Shopify)",
    ]
    for feature in features:
        print(f"  {feature}")
    
    print("\n📊 Demo Run (Mock Mode):")
    print("-" * 40)
    
    # 运行模拟工作流
    try:
        result = run_pod_workflow(
            niche="cat lovers",
            style="minimalist",
            num_designs=3,
            target_platforms=["etsy"],
            product_types=["t-shirt", "mug"]
        )
        
        print("\n✅ Demo completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        logger.exception("Demo error")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="POD Multi-Agent System - AI-powered print-on-demand automation"
    )
    
    parser.add_argument(
        "--niche",
        type=str,
        help="Target niche market (e.g., 'cat lovers', 'fitness')"
    )
    parser.add_argument(
        "--style",
        type=str,
        help="Design style (e.g., 'minimalist', 'vintage', 'cartoon')"
    )
    parser.add_argument(
        "--designs",
        type=int,
        default=5,
        help="Number of designs to generate (default: 5)"
    )
    parser.add_argument(
        "--platforms",
        type=str,
        nargs="+",
        default=["etsy"],
        help="Target platforms (default: etsy)"
    )
    parser.add_argument(
        "--products",
        type=str,
        nargs="+",
        default=["t-shirt", "mug"],
        help="Product types (default: t-shirt mug)"
    )
    parser.add_argument(
        "--human-review",
        action="store_true",
        help="Require human review before upload"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run demo mode"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output file for results (JSON format)"
    )
    
    args = parser.parse_args()
    
    if args.demo:
        run_demo()
        return
    
    if not args.niche or not args.style:
        parser.print_help()
        print("\n❌ Error: --niche and --style are required (or use --demo)")
        sys.exit(1)
    
    # 运行工作流
    result = run_pod_workflow(
        niche=args.niche,
        style=args.style,
        num_designs=args.designs,
        target_platforms=args.platforms,
        product_types=args.products,
        human_review=args.human_review
    )
    
    # 保存结果
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            # 转换不可序列化的对象
            serializable_result = json.loads(
                json.dumps(result, default=str)
            )
            json.dump(serializable_result, f, indent=2, ensure_ascii=False)
        print(f"\n📁 Results saved to: {args.output}")


if __name__ == "__main__":
    main()
