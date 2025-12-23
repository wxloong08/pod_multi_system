'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflows, useHealth } from "@/hooks";
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
        name: 'Trend Analysis Agent',
        description: 'Analyzes market trends using Claude 3.5 Sonnet',
        tech: 'Claude 3.5 Sonnet',
        step: 'trend_analysis'
    },
    {
        name: 'Design Generation Agent',
        description: 'Generates design images using DALL-E 3',
        tech: 'DALL-E 3',
        step: 'design_generation'
    },
    {
        name: 'Quality Check Agent',
        description: 'Validates design quality with retry mechanism',
        tech: 'Rules + LLM',
        step: 'quality_check'
    },
    {
        name: 'Mockup Creation Agent',
        description: 'Creates product mockups via Printful',
        tech: 'Printful API',
        step: 'mockup_creation'
    },
    {
        name: 'SEO Optimization Agent',
        description: 'Optimizes titles, descriptions, and tags',
        tech: 'Claude 3.5 Sonnet',
        step: 'seo_optimization'
    },
    {
        name: 'Platform Upload Agent',
        description: 'Publishes listings to marketplaces',
        tech: 'Etsy/Amazon API',
        step: 'platform_upload'
    },
    {
        name: 'Optimization Agent',
        description: 'Analyzes performance and provides recommendations',
        tech: 'Claude 3.5 Sonnet',
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
                                <Badge variant="default" className="text-xs">Running</Badge>
                            )}
                            {isCompleted && (
                                <Badge variant="outline" className="text-xs text-green-500 border-green-500">Complete</Badge>
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
                    <h1 className="text-3xl font-bold tracking-tight">Agent Status</h1>
                    <p className="text-muted-foreground">
                        Monitor your multi-agent workflow system
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
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
                                <p className="text-sm text-muted-foreground">API Server</p>
                                {healthLoading ? (
                                    <Skeleton className="h-6 w-20" />
                                ) : (
                                    <p className="text-lg font-semibold capitalize">
                                        {health?.status || 'Offline'}
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
                                <p className="text-sm text-muted-foreground">LangGraph</p>
                                {healthLoading ? (
                                    <Skeleton className="h-6 w-20" />
                                ) : (
                                    <p className="text-lg font-semibold">
                                        {health?.langgraph_available ? 'Connected' : 'Mock Mode'}
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
                                <p className="text-sm text-muted-foreground">Active Workflows</p>
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
                                <span className="text-muted-foreground">Version: </span>
                                <span className="font-mono">{health.version}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Last Check: </span>
                                <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Agent Pipeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Agent Pipeline</CardTitle>
                    <CardDescription>
                        Real-time status of each agent in the workflow
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
                        <CardTitle>Active Workflows</CardTitle>
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
                                            Step: {workflow.current_step} |
                                            Designs: {workflow.designs?.length || 0}/{workflow.num_designs}
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
