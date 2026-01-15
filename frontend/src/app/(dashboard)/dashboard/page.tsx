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

const STATUS_LABELS: Record<string, string> = {
    completed: '已完成',
    running: '运行中',
    pending: '等待中',
    failed: '失败',
    paused: '已暂停',
};

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
            {STATUS_LABELS[status] || status}
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
                    <h2 className="text-3xl font-bold tracking-tight">总览</h2>
                    <p className="text-muted-foreground">
                        欢迎回来！这是您的 POD 业务概览。
                    </p>
                </div>
                <Link href="/campaign/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        新建活动
                    </Button>
                </Link>
            </div>

            {/* API Status */}
            {workflowsError && (
                <Card className="border-destructive">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                            <p className="font-medium text-destructive">后端连接错误</p>
                            <p className="text-sm text-muted-foreground">
                                请确保 API 服务器已在 http://localhost:8000 运行
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="总收入"
                    value={`¥${(totalRevenue * 7).toFixed(2)}`}
                    description={`来自 ${completedWorkflows.length} 个已完成工作流`}
                    icon={DollarSign}
                    loading={workflowsLoading}
                />
                <StatCard
                    title="已生成设计"
                    value={designStats?.total_designs || 0}
                    description={designStats?.average_quality_score
                        ? `平均质量: ${(designStats.average_quality_score * 100).toFixed(0)}%`
                        : "暂无设计"
                    }
                    icon={ImageIcon}
                    loading={designsLoading}
                />
                <StatCard
                    title="活跃商品"
                    value={listingStats?.total_listings || 0}
                    description={Object.entries(listingStats?.platforms || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ') || "暂无商品"
                    }
                    icon={ShoppingBag}
                    loading={listingsLoading}
                />
                <StatCard
                    title="活跃工作流"
                    value={activeWorkflows.length}
                    description={health?.langgraph_available
                        ? "LangGraph 已连接"
                        : "模拟模式"
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
                        <CardTitle>最近的工作流</CardTitle>
                        <CardDescription>
                            您最近的 POD 生成工作流
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
                                <p className="text-muted-foreground mb-4">暂无工作流</p>
                                <Link href="/campaign/new">
                                    <Button variant="outline" size="sm">
                                        创建您的第一个活动
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
                                                {workflow.designs?.length || 0} 个设计 • {workflow.listings?.length || 0} 个商品
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
                        <CardTitle>设计质量</CardTitle>
                        <CardDescription>
                            已生成设计的质量分布
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
                                    暂无设计数据
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* High Quality */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-green-500" />
                                            高质量 (≥80%)
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
                                            中等质量 (50-79%)
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
                                            低质量 (&lt;50%)
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
                                    <p className="text-sm font-medium mb-2">风格统计</p>
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
