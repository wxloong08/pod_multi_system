'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateWorkflow } from "@/hooks";
import { useUIStore } from "@/store";
import {
    Sparkles,
    Palette,
    Target,
    Package,
    Store,
    Loader2,
    ArrowLeft,
    Check
} from "lucide-react";
import Link from "next/link";

const STYLE_OPTIONS = [
    { value: 'minimalist', label: '极简风格', description: '简洁、干净的设计' },
    { value: 'vintage', label: '复古风格', description: '怀旧、经典的风格' },
    { value: 'cartoon', label: '卡通风格', description: '有趣、插画风' },
    { value: 'typography', label: '字体设计', description: '以文字为主的设计' },
    { value: 'watercolor', label: '水彩风格', description: '艺术、手绘感' },
    { value: 'geometric', label: '几何图形', description: '现代图案与形状' },
];

const PLATFORM_OPTIONS = [
    { value: 'etsy', label: 'Etsy', icon: Store },
    { value: 'amazon', label: 'Amazon', icon: Package },
];

const PRODUCT_OPTIONS = [
    { value: 't-shirt', label: 'T恤' },
    { value: 'mug', label: '马克杯' },
    { value: 'poster', label: '海报' },
    { value: 'hoodie', label: '帽衫' },
    { value: 'tote-bag', label: '帆布袋' },
    { value: 'phone-case', label: '手机壳' },
];

export default function NewCampaignPage() {
    const router = useRouter();
    const { addNotification } = useUIStore();
    const createWorkflow = useCreateWorkflow();

    const [formData, setFormData] = useState({
        niche: '',
        style: 'minimalist',
        numDesigns: 5,
        targetPlatforms: ['etsy'],
        productTypes: ['t-shirt', 'mug'],
        humanReview: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await createWorkflow.mutateAsync({
                niche: formData.niche,
                style: formData.style,
                num_designs: formData.numDesigns,
                target_platforms: formData.targetPlatforms,
                product_types: formData.productTypes,
                human_review: formData.humanReview,
            });

            addNotification({
                type: 'success',
                title: '工作流已创建',
                message: `已开始为 "${formData.niche}" 生成 ${formData.numDesigns} 个设计`,
            });

            router.push('/dashboard');
        } catch (error) {
            addNotification({
                type: 'error',
                title: '创建工作流失败',
                message: error instanceof Error ? error.message : '未知错误',
            });
        }
    };

    const togglePlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            targetPlatforms: prev.targetPlatforms.includes(platform)
                ? prev.targetPlatforms.filter(p => p !== platform)
                : [...prev.targetPlatforms, platform]
        }));
    };

    const toggleProduct = (product: string) => {
        setFormData(prev => ({
            ...prev,
            productTypes: prev.productTypes.includes(product)
                ? prev.productTypes.filter(p => p !== product)
                : [...prev.productTypes, product]
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">新建活动</h1>
                    <p className="text-muted-foreground">
                        创建新的 POD 设计生成工作流
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Niche Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            目标市场
                        </CardTitle>
                        <CardDescription>
                            输入您想要定位的市场（例如："猫咪爱好者"、"健身达人"）
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="niche">市场细分</Label>
                            <Input
                                id="niche"
                                placeholder="例如：猫咪爱好者、咖啡迷、瑜伽爱好者"
                                value={formData.niche}
                                onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                                required
                                className="max-w-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Style Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            设计风格
                        </CardTitle>
                        <CardDescription>
                            选择您设计的视觉风格
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {STYLE_OPTIONS.map(style => (
                                <button
                                    key={style.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, style: style.value }))}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${formData.style === style.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-primary/50'
                                        }`}
                                >
                                    <div className="font-medium flex items-center gap-2">
                                        {formData.style === style.value && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                        {style.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {style.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Number of Designs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            生成设置
                        </CardTitle>
                        <CardDescription>
                            配置生成设计的数量
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="numDesigns">设计数量</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="numDesigns"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={formData.numDesigns}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        numDesigns: parseInt(e.target.value) || 1
                                    }))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">
                                    预估成本: ¥{(formData.numDesigns * 0.04).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="humanReview"
                                checked={formData.humanReview}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    humanReview: e.target.checked
                                }))}
                                className="rounded border-input"
                            />
                            <Label htmlFor="humanReview" className="text-sm font-normal">
                                发布前需要人工审核
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            目标平台
                        </CardTitle>
                        <CardDescription>
                            选择要发布商品的平台
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {PLATFORM_OPTIONS.map(platform => {
                                const Icon = platform.icon;
                                const isSelected = formData.targetPlatforms.includes(platform.value);
                                return (
                                    <button
                                        key={platform.value}
                                        type="button"
                                        onClick={() => togglePlatform(platform.value)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted hover:border-primary/50'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`} />
                                        {platform.label}
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Product Types */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            产品类型
                        </CardTitle>
                        <CardDescription>
                            选择要创建 Mockup 的产品类型
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {PRODUCT_OPTIONS.map(product => (
                                <Badge
                                    key={product.value}
                                    variant={formData.productTypes.includes(product.value) ? "default" : "outline"}
                                    className="cursor-pointer text-sm py-1.5 px-3"
                                    onClick={() => toggleProduct(product.value)}
                                >
                                    {formData.productTypes.includes(product.value) && (
                                        <Check className="h-3 w-3 mr-1" />
                                    )}
                                    {product.label}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4">
                    <Link href="/dashboard">
                        <Button variant="outline" type="button">取消</Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={!formData.niche || createWorkflow.isPending}
                        className="gap-2"
                    >
                        {createWorkflow.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                创建中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                开始生成
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
