'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { useWorkflows, useHealth } from "../../../hooks";
import {
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
    Zap,
    Server,
    Database,
    Cpu
} from "lucide-react";

const AGENTS = [
    {
        name: '趋势分析 Agent',
        description: '分析市场趋势，生成设计建议',
        tech: 'Claude Haiku 4.5',
        step: 'trend_analysis'
    },
    {
        name: '设计生成 Agent',
        description: '根据提示词生成设计图',
        tech: 'GPT Image 1.5',
        step: 'design_generation'
    },
    {
        name: '质量检查 Agent',
        description: '验证设计质量，支持自动重试',
        tech: 'Claude Haiku 4.5',
        step: 'quality_check'
    },
    {
        name: 'Mockup 合成 Agent',
        description: '创建产品 Mockup 预览图',
        tech: 'Printful API',
        step: 'mockup_creation'
    },
    {
        name: 'SEO 优化 Agent',
        description: '优化商品标题、描述和标签',
        tech: 'Claude Haiku 4.5',
        step: 'seo_optimization'
    },
    {
        name: '平台上传 Agent',
        description: '发布商品到电商平台',
        tech: 'Etsy/Amazon API',
        step: 'platform_upload'
    },
    {
        name: '数据优化 Agent',
        description: '分析销售表现，提供优化建议',
        tech: 'Claude Haiku 4.5',
        step: 'optimization'
    },
];

function AgentCard({
    agent,
    isActive,
    isCompleted
}: {
    agent: typeof AGENTS[0];
    isActive: boolean;
    isCompleted: boolean;
}) {
    return (
        <Card className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                        {isActive ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : (
                            <Cpu className="h-5 w-5" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{agent.name}</h3>
                            {isActive && (
                                <Badge variant="default" className="text-xs">运行中</Badge>
                            )}
                            {isCompleted && (
                                <Badge variant="outline" className="text-xs text-green-500 border-green-500">已完成</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                            {agent.description}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                            {agent.tech}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function StatusPage() {
    const { data: workflowsData, isLoading: workflowsLoading, refetch } = useWorkflows({ limit: 10 });
    const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();

    const activeWorkflows = workflowsData?.workflows.filter(
        w => w.status === 'running' || w.status === 'pending'
    ) || [];

    // Get current step from active workflows
    const currentSteps = activeWorkflows.map(w => w.current_step);

    const handleRefresh = () => {
        refetch();
        refetchHealth();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agent 状态</h1>
                    <p className="text-muted-foreground">
                        监控您的多 Agent 工作流系统
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    刷新
                </Button>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${health?.status === 'healthy'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                                }`}>
                                <Server className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">API 服务器</p>
                                {healthLoading ? (
                                    <Skeleton className="h-6 w-20" />
                                ) : (
                                    <p className="text-lg font-semibold">
                                        {health?.status === 'healthy' ? '正常' : '离线'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${health?.langgraph_available
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                <Zap className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">LangGraph 引擎</p>
                                {healthLoading ? (
                                    <Skeleton className="h-6 w-20" />
                                ) : (
                                    <p className="text-lg font-semibold">
                                        {health?.langgraph_available ? '已连接' : '模拟模式'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${activeWorkflows.length > 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">活跃工作流</p>
                                {workflowsLoading ? (
                                    <Skeleton className="h-6 w-12" />
                                ) : (
                                    <p className="text-lg font-semibold">
                                        {activeWorkflows.length}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Version Info */}
            {health && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-6 text-sm">
                            <div>
                                <span className="text-muted-foreground">版本: </span>
                                <span className="font-mono">{health.version}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">上次检查: </span>
                                <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Agent Pipeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Agent 管道</CardTitle>
                    <CardDescription>
                        工作流中各 Agent 的实时状态
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {AGENTS.map((agent, index) => {
                            const isActive = currentSteps.includes(agent.step);
                            // For demo: consider completed if there's an active workflow past this step
                            const stepOrder = AGENTS.map(a => a.step);
                            const isCompleted = activeWorkflows.some(w => {
                                const currentIndex = stepOrder.indexOf(w.current_step);
                                const agentIndex = stepOrder.indexOf(agent.step);
                                return currentIndex > agentIndex;
                            });

                            return (
                                <AgentCard
                                    key={agent.step}
                                    agent={agent}
                                    isActive={isActive}
                                    isCompleted={isCompleted}
                                />
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Active Workflows */}
            {activeWorkflows.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>活跃工作流</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeWorkflows.map(workflow => (
                                <div
                                    key={workflow.workflow_id}
                                    className="flex items-center gap-4 p-4 rounded-lg border"
                                >
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {workflow.niche} - {workflow.style}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            步骤: {workflow.current_step} |
                                            设计: {workflow.designs?.length || 0}/{workflow.num_designs}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {workflow.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
