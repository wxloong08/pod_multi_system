'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDesigns, useDesignStats } from "@/hooks";
import {
    Image as ImageIcon,
    Search,
    Filter,
    Star,
    ExternalLink,
    Download
} from "lucide-react";

function DesignCard({ design }: { design: any }) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // 处理图片 URL - 相对路径需要加上后端地址
    const getImageUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('/static/')) {
            return `${API_URL}${url}`;
        }
        return url;
    };

    const qualityColor = (score: number | null | undefined) => {
        if (!score) return 'bg-gray-500';
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.5) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const imageUrl = getImageUrl(design.image_url);

    // 提取标题逻辑：只显示冒号前的部分
    const getDesignTitle = (prompt: string): string => {
        if (!prompt) return '';
        // 尝试用中英文冒号分割，取第一部分
        const parts = prompt.split(/[:：]/);
        if (parts.length > 1) {
            return parts[0].trim();
        }
        return prompt;
    };

    // 查看图片处理
    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (imageUrl) {
            window.open(imageUrl, '_blank');
        }
    };

    // 下载图片处理
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!imageUrl) return;

        // 使用后端下载接口，确保强制下载 headers 生效
        let path = imageUrl;
        if (path.startsWith(API_URL)) {
            path = path.replace(API_URL, '');
        }

        const downloadUrl = `${API_URL}/api/v1/utils/download?path=${encodeURIComponent(path)}`;

        // 创建隐藏的 iframe 或 a 标签触发下载
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = ''; // 浏览器会使用后端 filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="overflow-hidden group">
            <div className="aspect-square bg-muted relative">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={design.prompt}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={handleView}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        查看
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>

                {/* Quality badge */}
                {design.quality_score && (
                    <div className="absolute top-2 right-2">
                        <Badge className={`${qualityColor(design.quality_score)} text-white`}>
                            <Star className="h-3 w-3 mr-1" />
                            {(design.quality_score * 100).toFixed(0)}%
                        </Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                <p className="text-sm font-medium line-clamp-2 mb-2" title={design.prompt}>
                    {getDesignTitle(design.prompt)}
                </p>
                <div className="flex items-center justify-between">
                    <Badge variant="outline">{design.style}</Badge>
                    <span className="text-xs text-muted-foreground">
                        {new Date(design.created_at).toLocaleDateString('zh-CN')}
                    </span>
                </div>
                {design.keywords && design.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {design.keywords.slice(0, 3).map((keyword: string) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DesignCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-square" />
            <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function DesignsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [styleFilter, setStyleFilter] = useState<string | undefined>();

    const { data: designs, isLoading, error } = useDesigns({
        style: styleFilter,
        limit: 50,
    });
    const { data: stats } = useDesignStats();

    const filteredDesigns = designs?.filter(d =>
        searchQuery === '' ||
        d.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    const styles = Object.keys(stats?.styles || {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">设计图库</h1>
                <p className="text-muted-foreground">
                    浏览和管理您生成的设计
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats?.total_designs || 0}</div>
                        <p className="text-xs text-muted-foreground">设计总数</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {stats?.average_quality_score
                                ? `${(stats.average_quality_score * 100).toFixed(0)}%`
                                : '-'
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">平均质量</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.quality_distribution.high || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">高质量</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{styles.length}</div>
                        <p className="text-xs text-muted-foreground">风格数量</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索设计..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={!styleFilter ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStyleFilter(undefined)}
                    >
                        全部
                    </Button>
                    {styles.map(style => (
                        <Button
                            key={style}
                            variant={styleFilter === style ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStyleFilter(style)}
                        >
                            {style}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Design Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <DesignCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-destructive">加载设计失败</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            请确保后端服务器正在运行
                        </p>
                    </CardContent>
                </Card>
            ) : filteredDesigns.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            {searchQuery ? '没有匹配的设计' : '暂无设计'}
                        </p>
                        {!searchQuery && (
                            <Button variant="outline" className="mt-4" asChild>
                                <a href="/campaign/new">创建您的第一个活动</a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredDesigns.map(design => (
                        <DesignCard key={design.design_id} design={design} />
                    ))}
                </div>
            )}
        </div>
    );
}
