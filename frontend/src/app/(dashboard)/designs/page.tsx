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
    const qualityColor = (score: number | null | undefined) => {
        if (!score) return 'bg-gray-500';
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.5) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <Card className="overflow-hidden group">
            <div className="aspect-square bg-muted relative">
                {design.image_url ? (
                    <img
                        src={design.image_url}
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
                    <Button size="sm" variant="secondary">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button size="sm" variant="secondary">
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
                <p className="text-sm font-medium line-clamp-2 mb-2">
                    {design.prompt}
                </p>
                <div className="flex items-center justify-between">
                    <Badge variant="outline">{design.style}</Badge>
                    <span className="text-xs text-muted-foreground">
                        {new Date(design.created_at).toLocaleDateString()}
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
                <h1 className="text-3xl font-bold tracking-tight">Designs</h1>
                <p className="text-muted-foreground">
                    Browse and manage your generated designs
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats?.total_designs || 0}</div>
                        <p className="text-xs text-muted-foreground">Total Designs</p>
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
                        <p className="text-xs text-muted-foreground">Avg Quality</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.quality_distribution.high || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">High Quality</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{styles.length}</div>
                        <p className="text-xs text-muted-foreground">Styles Used</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search designs..."
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
                        All
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
                        <p className="text-destructive">Failed to load designs</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Make sure the backend server is running
                        </p>
                    </CardContent>
                </Card>
            ) : filteredDesigns.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            {searchQuery ? 'No designs match your search' : 'No designs yet'}
                        </p>
                        {!searchQuery && (
                            <Button variant="outline" className="mt-4" asChild>
                                <a href="/campaign/new">Create your first campaign</a>
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
