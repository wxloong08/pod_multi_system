"""
本地 Mockup 生成模块
使用 Pillow 将设计图合成到产品模板上

支持产品类型：T恤、马克杯、海报、帽衫、帆布袋
"""

import os
import uuid
import asyncio
from pathlib import Path
from typing import Optional, Tuple
from io import BytesIO
import base64

try:
    from PIL import Image, ImageDraw, ImageFont
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

import logging

logger = logging.getLogger(__name__)


# 产品模板配置：定义设计图在产品上的位置和大小
PRODUCT_CONFIGS = {
    "t-shirt": {
        "canvas_size": (800, 1000),
        "design_area": (200, 180, 600, 580),  # (x1, y1, x2, y2)
        "background_color": "#FFFFFF",
        "product_color": "#2C3E50",
        "product_shape": "tshirt"
    },
    "mug": {
        "canvas_size": (800, 600),
        "design_area": (250, 150, 550, 450),
        "background_color": "#F5F5F5",
        "product_color": "#FFFFFF",
        "product_shape": "mug"
    },
    "poster": {
        "canvas_size": (600, 800),
        "design_area": (50, 50, 550, 750),
        "background_color": "#E8E8E8",
        "product_color": "#FFFFFF",
        "product_shape": "rectangle"
    },
    "hoodie": {
        "canvas_size": (800, 1000),
        "design_area": (220, 200, 580, 560),
        "background_color": "#FFFFFF",
        "product_color": "#333333",
        "product_shape": "hoodie"
    },
    "tote-bag": {
        "canvas_size": (700, 800),
        "design_area": (150, 150, 550, 550),
        "background_color": "#FAFAFA",
        "product_color": "#F5E6D3",
        "product_shape": "tote"
    }
}


class LocalMockupGenerator:
    """本地 Mockup 生成器"""
    
    def __init__(self, output_dir: str = None):
        """
        初始化 Mockup 生成器
        
        Args:
            output_dir: Mockup 输出目录，默认为 ./output/mockups
        """
        if not PILLOW_AVAILABLE:
            raise ImportError("Pillow is required for local mockup generation. Install with: pip install Pillow")
        
        self.output_dir = Path(output_dir or "./output/mockups")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"LocalMockupGenerator initialized, output dir: {self.output_dir}")
    
    async def generate_mockup(
        self,
        design_image_path: str,
        product_type: str,
        output_filename: str = None
    ) -> str:
        """
        生成产品 Mockup
        
        Args:
            design_image_path: 设计图路径或 URL
            product_type: 产品类型 (t-shirt, mug, poster, hoodie, tote-bag)
            output_filename: 输出文件名，默认自动生成
            
        Returns:
            生成的 Mockup 文件路径
        """
        config = PRODUCT_CONFIGS.get(product_type)
        if not config:
            logger.warning(f"Unknown product type: {product_type}, using default (poster)")
            config = PRODUCT_CONFIGS["poster"]
        
        # 加载设计图
        design_img = await self._load_design_image(design_image_path)
        if design_img is None:
            # 创建占位图
            design_img = self._create_placeholder_design()
        
        # 创建产品 Mockup
        mockup = self._create_product_mockup(design_img, config, product_type)
        
        # 保存 Mockup
        if output_filename is None:
            output_filename = f"mockup_{product_type}_{uuid.uuid4().hex[:8]}.png"
        
        output_path = self.output_dir / output_filename
        mockup.save(output_path, "PNG", quality=95)
        
        logger.info(f"Mockup generated: {output_path}")
        return str(output_path)
    
    async def _load_design_image(self, image_source: str) -> Optional[Image.Image]:
        """加载设计图（支持本地路径和 URL）"""
        try:
            # 处理 /static/ 相对路径 - 转换为 Docker 容器内的绝对路径
            if image_source.startswith("/static/"):
                # 在 Docker 容器中，/static/ 实际对应 /app/static/
                image_source = "/app" + image_source
                logger.info(f"Converted static path to: {image_source}")
            
            if image_source.startswith(("http://", "https://")):
                # URL - 尝试下载
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    async with session.get(image_source) as response:
                        if response.status == 200:
                            data = await response.read()
                            return Image.open(BytesIO(data)).convert("RGBA")
            elif os.path.exists(image_source):
                # 本地文件
                logger.info(f"Loading local image: {image_source}")
                return Image.open(image_source).convert("RGBA")
            elif image_source.startswith("data:image"):
                # Base64 编码的图片
                header, data = image_source.split(",", 1)
                img_data = base64.b64decode(data)
                return Image.open(BytesIO(img_data)).convert("RGBA")
            else:
                logger.warning(f"Image source not found or invalid: {image_source}")
        except Exception as e:
            logger.error(f"Failed to load design image: {e}")
        
        return None
    
    def _create_placeholder_design(self) -> Image.Image:
        """创建占位设计图"""
        img = Image.new("RGBA", (400, 400), (200, 200, 200, 255))
        draw = ImageDraw.Draw(img)
        
        # 画一个简单的图案
        draw.rectangle([50, 50, 350, 350], outline=(100, 100, 100), width=3)
        draw.line([50, 50, 350, 350], fill=(150, 150, 150), width=2)
        draw.line([350, 50, 50, 350], fill=(150, 150, 150), width=2)
        
        # 添加文字
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        draw.text((120, 180), "Design Here", fill=(100, 100, 100), font=font)
        
        return img
    
    def _create_product_mockup(
        self,
        design: Image.Image,
        config: dict,
        product_type: str
    ) -> Image.Image:
        """创建产品 Mockup"""
        canvas_size = config["canvas_size"]
        design_area = config["design_area"]
        bg_color = config["background_color"]
        product_color = config["product_color"]
        
        # 创建画布
        canvas = Image.new("RGB", canvas_size, bg_color)
        draw = ImageDraw.Draw(canvas)
        
        # 绘制产品形状
        self._draw_product_shape(draw, canvas_size, product_color, product_type)
        
        # 计算设计区域大小
        design_width = design_area[2] - design_area[0]
        design_height = design_area[3] - design_area[1]
        
        # 调整设计图大小以适应区域
        design_resized = self._resize_to_fit(design, (design_width, design_height))
        
        # 计算居中位置
        paste_x = design_area[0] + (design_width - design_resized.width) // 2
        paste_y = design_area[1] + (design_height - design_resized.height) // 2
        
        # 粘贴设计图（支持透明度）
        if design_resized.mode == "RGBA":
            canvas.paste(design_resized, (paste_x, paste_y), design_resized)
        else:
            canvas.paste(design_resized, (paste_x, paste_y))
        
        return canvas
    
    def _draw_product_shape(
        self,
        draw: ImageDraw.Draw,
        canvas_size: Tuple[int, int],
        color: str,
        product_type: str
    ):
        """绘制产品形状"""
        w, h = canvas_size
        
        if product_type == "t-shirt":
            # T恤形状
            points = [
                (w*0.3, h*0.1),   # 左肩
                (w*0.4, h*0.08),  # 领口左
                (w*0.5, h*0.12),  # 领口中
                (w*0.6, h*0.08),  # 领口右
                (w*0.7, h*0.1),   # 右肩
                (w*0.85, h*0.25), # 右袖
                (w*0.7, h*0.3),   # 右腋
                (w*0.7, h*0.9),   # 右下
                (w*0.3, h*0.9),   # 左下
                (w*0.3, h*0.3),   # 左腋
                (w*0.15, h*0.25), # 左袖
            ]
            draw.polygon(points, fill=color, outline="#000000")
            
        elif product_type == "mug":
            # 马克杯形状
            draw.ellipse([w*0.25, h*0.1, w*0.75, h*0.25], fill=color, outline="#CCCCCC")
            draw.rectangle([w*0.25, h*0.15, w*0.75, h*0.85], fill=color, outline="#CCCCCC")
            draw.ellipse([w*0.25, h*0.75, w*0.75, h*0.9], fill=color, outline="#CCCCCC")
            # 把手
            draw.arc([w*0.7, h*0.3, w*0.9, h*0.7], 270, 90, fill="#CCCCCC", width=8)
            
        elif product_type == "hoodie":
            # 帽衫形状（类似 T 恤但有帽子）
            points = [
                (w*0.25, h*0.15),
                (w*0.4, h*0.1),
                (w*0.5, h*0.05),  # 帽子顶
                (w*0.6, h*0.1),
                (w*0.75, h*0.15),
                (w*0.88, h*0.3),
                (w*0.72, h*0.35),
                (w*0.72, h*0.92),
                (w*0.28, h*0.92),
                (w*0.28, h*0.35),
                (w*0.12, h*0.3),
            ]
            draw.polygon(points, fill=color, outline="#000000")
            
        elif product_type == "tote-bag":
            # 帆布袋形状
            draw.rectangle([w*0.15, h*0.2, w*0.85, h*0.9], fill=color, outline="#8B7355")
            # 提手
            draw.arc([w*0.25, h*0.05, w*0.45, h*0.25], 180, 0, fill="#8B7355", width=6)
            draw.arc([w*0.55, h*0.05, w*0.75, h*0.25], 180, 0, fill="#8B7355", width=6)
            
        else:  # poster / default
            # 海报/矩形
            margin = min(w, h) * 0.05
            draw.rectangle([margin, margin, w-margin, h-margin], fill=color, outline="#CCCCCC")
    
    def _resize_to_fit(self, img: Image.Image, max_size: Tuple[int, int]) -> Image.Image:
        """等比缩放图片以适应指定区域"""
        img_ratio = img.width / img.height
        area_ratio = max_size[0] / max_size[1]
        
        if img_ratio > area_ratio:
            # 图片更宽，以宽度为准
            new_width = max_size[0]
            new_height = int(new_width / img_ratio)
        else:
            # 图片更高，以高度为准
            new_height = max_size[1]
            new_width = int(new_height * img_ratio)
        
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)


# 便捷函数
async def generate_local_mockup(
    design_path: str,
    product_type: str,
    output_dir: str = None
) -> str:
    """
    生成本地 Mockup（便捷函数）
    
    Args:
        design_path: 设计图路径
        product_type: 产品类型
        output_dir: 输出目录
        
    Returns:
        Mockup 文件路径
    """
    generator = LocalMockupGenerator(output_dir)
    return await generator.generate_mockup(design_path, product_type)
