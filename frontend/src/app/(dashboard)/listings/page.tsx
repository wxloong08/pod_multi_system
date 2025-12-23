'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useListings, useListingStats } from "@/hooks";
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
            {status}
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
                <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
                <p className="text-muted-foreground">
                    Manage your published product listings
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats?.total_listings || 0}</div>
                        <p className="text-xs text-muted-foreground">Total Listings</p>
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
                        <p className="text-xs text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search listings..."
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
                        All
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
                    <CardTitle>All Listings</CardTitle>
                    <CardDescription>
                        {filteredListings.length} listings found
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
                            <p className="text-destructive">Failed to load listings</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Make sure the backend server is running
                            </p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery ? 'No listings match your search' : 'No listings yet'}
                            </p>
                            {!searchQuery && (
                                <Button variant="outline" className="mt-4" asChild>
                                    <a href="/campaign/new">Create your first campaign</a>
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
                                            Design: {listing.design_id} • Listed: {new Date(listing.listed_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <StatusBadge status={listing.status} />
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
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
