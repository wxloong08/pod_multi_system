'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Box,
    ShoppingCart,
    Shirt,
    Coffee,
    Package,
    RefreshCw,
    Image as ImageIcon
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Product {
    product_id: string;
    design_id: string;
    product_type: string;
    mockup_url: string;
    variants: any[];
    printful_product_id: string | null;
    created_at: string;
}

interface ProductStats {
    total_products: number;
    product_types: Record<string, number>;
}

function ProductIcon({ type }: { type: string }) {
    const icons: Record<string, React.ReactNode> = {
        "t-shirt": <Shirt className="h-5 w-5" />,
        "mug": <Coffee className="h-5 w-5" />,
        "bag": <ShoppingCart className="h-5 w-5" />,
    };
    return icons[type] || <Box className="h-5 w-5" />;
}

function getImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/static/')) {
        return `${API_URL}${url}`;
    }
    return url;
}

function ProductCard({ product }: { product: Product }) {
    const imageUrl = getImageUrl(product.mockup_url);

    return (
        <Card className="overflow-hidden group">
            <div className="aspect-square bg-muted relative">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.product_type}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                )}
            </div>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ProductIcon type={product.product_type} />
                    </div>
                    <div>
                        <p className="font-medium capitalize">{product.product_type}</p>
                        <p className="text-xs text-muted-foreground">
                            {product.variants?.length || 0} 个变体
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <Badge variant="outline">{product.product_id.slice(0, 12)}...</Badge>
                    <span className="text-xs text-muted-foreground">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString('zh-CN') : '-'}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-square" />
            <CardContent className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardContent>
        </Card>
    );
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<ProductStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/v1/products?limit=50`),
                fetch(`${API_URL}/api/v1/products/stats/summary`)
            ]);

            if (!productsRes.ok || !statsRes.ok) {
                throw new Error('Failed to fetch products data');
            }

            const productsData = await productsRes.json();
            const statsData = await statsRes.json();

            setProducts(productsData);
            setStats(statsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">产品管理</h1>
                    <p className="text-muted-foreground">
                        查看所有生成的 POD 产品 Mockup
                    </p>
                </div>
                <Button onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                </Button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {loading ? <Skeleton className="h-8 w-12" /> : stats?.total_products || 0}
                                </div>
                                <p className="text-sm text-muted-foreground">总产品数</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <Shirt className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {loading ? <Skeleton className="h-8 w-12" /> : stats?.product_types?.['t-shirt'] || 0}
                                </div>
                                <p className="text-sm text-muted-foreground">T恤</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Coffee className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {loading ? <Skeleton className="h-8 w-12" /> : stats?.product_types?.['mug'] || 0}
                                </div>
                                <p className="text-sm text-muted-foreground">马克杯</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 错误提示 */}
            {error && (
                <Card className="bg-destructive/10 border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive">加载失败: {error}</p>
                    </CardContent>
                </Card>
            )}

            {/* 产品列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>产品列表</CardTitle>
                    <CardDescription>
                        通过 Pillow 本地合成的产品 Mockup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">暂无产品</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                创建工作流后自动生成产品 Mockup
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map(product => (
                                <ProductCard key={product.product_id} product={product} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 演示模式提示 */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Package className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="font-medium">演示模式</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                产品 Mockup 使用 Pillow 本地合成。生产环境可接入 Printful API 获取真实产品渲染。
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
