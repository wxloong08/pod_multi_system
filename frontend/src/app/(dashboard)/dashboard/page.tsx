'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflows, useDesignStats, useListingStats, useHealth } from "@/hooks";
import {
    DollarSign,
    Image as ImageIcon,
    ShoppingBag,
    Activity,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus
} from "lucide-react";
import Link from "next/link";

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    loading
}: {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
    loading?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-8 w-24 mb-1" />
                        <Skeleton className="h-4 w-32" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
        completed: { variant: "default", icon: CheckCircle2 },
        running: { variant: "secondary", icon: Activity },
        pending: { variant: "outline", icon: Clock },
        failed: { variant: "destructive", icon: AlertCircle },
        paused: { variant: "outline", icon: Clock },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    );
}

export default function DashboardPage() {
    const { data: workflowsData, isLoading: workflowsLoading, error: workflowsError } = useWorkflows({ limit: 10 });
    const { data: designStats, isLoading: designsLoading } = useDesignStats();
    const { data: listingStats, isLoading: listingsLoading } = useListingStats();
    const { data: health, isLoading: healthLoading } = useHealth();

    const workflows = workflowsData?.workflows || [];
    const activeWorkflows = workflows.filter(w => w.status === 'running' || w.status === 'pending');
    const completedWorkflows = workflows.filter(w => w.status === 'completed');

    // Calculate mock revenue (in real app, this would come from sales data)
    const totalRevenue = completedWorkflows.length * 25.99;

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s an overview of your POD business.
                    </p>
                </div>
                <Link href="/campaign/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {/* API Status */}
            {workflowsError && (
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                            <p className="font-medium text-destructive">Backend Connection Error</p>
                            <p className="text-sm text-muted-foreground">
                                Make sure the API server is running at http://localhost:8000
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value={`$${totalRevenue.toFixed(2)}`}
                    description={`From ${completedWorkflows.length} completed workflows`}
                    icon={DollarSign}
                    loading={workflowsLoading}
                />
                <StatCard
                    title="Designs Generated"
                    value={designStats?.total_designs || 0}
                    description={designStats?.average_quality_score
                        ? `Avg quality: ${(designStats.average_quality_score * 100).toFixed(0)}%`
                        : "No designs yet"
                    }
                    icon={ImageIcon}
                    loading={designsLoading}
                />
                <StatCard
                    title="Active Listings"
                    value={listingStats?.total_listings || 0}
                    description={Object.entries(listingStats?.platforms || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ') || "No listings yet"
                    }
                    icon={ShoppingBag}
                    loading={listingsLoading}
                />
                <StatCard
                    title="Active Workflows"
                    value={activeWorkflows.length}
                    description={health?.langgraph_available
                        ? "LangGraph connected"
                        : "Using mock mode"
                    }
                    icon={Activity}
                    loading={workflowsLoading || healthLoading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Workflows */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Workflows</CardTitle>
                        <CardDescription>
                            Your latest POD generation workflows
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {workflowsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : workflows.length === 0 ? (
                            <div className="text-center py-8">
                                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground mb-4">No workflows yet</p>
                                <Link href="/campaign/new">
                                    <Button variant="outline" size="sm">
                                        Create your first campaign
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {workflows.slice(0, 5).map((workflow) => (
                                    <div key={workflow.workflow_id} className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <ImageIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {workflow.niche} - {workflow.style}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {workflow.designs?.length || 0} designs • {workflow.listings?.length || 0} listings
                                            </p>
                                        </div>
                                        <StatusBadge status={workflow.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quality Distribution */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Design Quality</CardTitle>
                        <CardDescription>
                            Quality distribution of generated designs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {designsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : !designStats || designStats.total_designs === 0 ? (
                            <div className="text-center py-8">
                                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">
                                    No design data yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* High Quality */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-green-500" />
                                            High Quality (≥80%)
                                        </span>
                                        <span className="font-medium">
                                            {designStats.quality_distribution.high}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all"
                                            style={{
                                                width: `${(designStats.quality_distribution.high / designStats.total_designs) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Medium Quality */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                            Medium Quality (50-79%)
                                        </span>
                                        <span className="font-medium">
                                            {designStats.quality_distribution.medium}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 transition-all"
                                            style={{
                                                width: `${(designStats.quality_distribution.medium / designStats.total_designs) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Low Quality */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500" />
                                            Low Quality (&lt;50%)
                                        </span>
                                        <span className="font-medium">
                                            {designStats.quality_distribution.low}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all"
                                            style={{
                                                width: `${(designStats.quality_distribution.low / designStats.total_designs) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Styles */}
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Styles</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(designStats.styles || {}).map(([style, count]) => (
                                            <Badge key={style} variant="secondary">
                                                {style}: {count as number}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
