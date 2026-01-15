'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";
import { useListings, useListingStats } from "../../../hooks";
import {
    ShoppingBag,
    Search,
    ExternalLink,
    Store,
    Package,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
    active: '在售',
    pending: '等待中',
    inactive: '已下架',
    failed: '失败',
};

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
        active: { variant: "default", icon: CheckCircle },
        pending: { variant: "outline", icon: Clock },
        inactive: { variant: "secondary", icon: XCircle },
        failed: { variant: "destructive", icon: XCircle },
    };

    const statusConfig = config[status.toLowerCase()] || config.pending;
    const Icon = statusConfig.icon;

    return (
        <Badge variant={statusConfig.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {STATUS_LABELS[status.toLowerCase()] || status}
        </Badge>
    );
}

function PlatformIcon({ platform }: { platform: string }) {
    const icons: Record<string, React.ReactNode> = {
        etsy: <Store className="h-4 w-4" />,
        amazon: <Package className="h-4 w-4" />,
    };
    return icons[platform.toLowerCase()] || <ShoppingBag className="h-4 w-4" />;
}

export default function ListingsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState<string | undefined>();

    const { data: listings, isLoading, error } = useListings({
        platform: platformFilter,
        limit: 50,
    });
    const { data: stats } = useListingStats();

    const filteredListings = listings?.filter(l =>
        searchQuery === '' ||
        l.listing_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.platform.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const platforms = Object.keys(stats?.platforms || {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">商品列表</h1>
                <p className="text-muted-foreground">
                    管理您已发布的商品
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats?.total_listings || 0}</div>
                        <p className="text-xs text-muted-foreground">商品总数</p>
                    </CardContent>
                </Card>
                {Object.entries(stats?.platforms || {}).map(([platform, count]) => (
                    <Card key={platform}>
                        <CardContent className="pt-6 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <PlatformIcon platform={platform} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{count as number}</div>
                                <p className="text-xs text-muted-foreground capitalize">{platform}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.statuses?.active || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">在售中</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索商品..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={!platformFilter ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformFilter(undefined)}
                    >
                        全部
                    </Button>
                    {platforms.map(platform => (
                        <Button
                            key={platform}
                            variant={platformFilter === platform ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPlatformFilter(platform)}
                            className="gap-2"
                        >
                            <PlatformIcon platform={platform} />
                            {platform}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Listings Table */}
            <Card>
                <CardHeader>
                    <CardTitle>所有商品</CardTitle>
                    <CardDescription>
                        共找到 {filteredListings.length} 个商品
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center">
                            <p className="text-destructive">加载商品失败</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                请确保后端服务器正在运行
                            </p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery ? '没有匹配的商品' : '暂无商品'}
                            </p>
                            {!searchQuery && (
                                <Button variant="outline" className="mt-4" asChild>
                                    <a href="/campaign/new">创建您的第一个活动</a>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredListings.map(listing => (
                                <div
                                    key={listing.listing_id}
                                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <PlatformIcon platform={listing.platform} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {listing.listing_id}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            设计: {listing.design_id} • 上架时间: {new Date(listing.listed_at).toLocaleDateString('zh-CN')}
                                        </p>
                                    </div>
                                    <StatusBadge status={listing.status} />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => alert(`演示模式提示：\n本项目为演示系统，未连接真实电商环境，因此不执行外部跳转。`)}
                                        title="查看商品 (模拟)"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
