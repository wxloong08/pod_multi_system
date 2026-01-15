'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Separator } from "../../../components/ui/separator";
import {
    Settings,
    Key,
    Globe,
    Bell,
    Palette,
    Save,
    ExternalLink,
    CheckCircle,
    AlertCircle
} from "lucide-react";

export default function SettingsPage() {
    const [apiSettings, setApiSettings] = useState({
        yunwuKey: '',
        langfusePublicKey: '',
        langfuseSecretKey: '',
        printfulKey: '',
        etsyKey: ''
    });

    const [preferences, setPreferences] = useState({
        demoMode: true,
        autoQualityCheck: true,
        humanReview: false,
        notifications: true
    });

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
                <p className="text-muted-foreground">
                    配置 API 密钥和系统偏好设置
                </p>
            </div>

            {/* API 配置 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        <CardTitle>API 配置</CardTitle>
                    </div>
                    <CardDescription>
                        配置各服务的 API 密钥（敏感信息请在服务器 .env 文件中配置）
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Yunwu API */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="yunwu">Yunwu.ai API Key</Label>
                            <Badge variant="outline" className="gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                已配置
                            </Badge>
                        </div>
                        <Input
                            id="yunwu"
                            type="password"
                            placeholder="sk-..."
                            value={apiSettings.yunwuKey}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, yunwuKey: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            用于 Claude 和 DALL-E 模型的中转 API
                            <a href="https://yunwu.ai" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                                获取密钥 <ExternalLink className="inline h-3 w-3" />
                            </a>
                        </p>
                    </div>

                    <Separator />

                    {/* Langfuse */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Langfuse 监控</Label>
                            <Badge variant="secondary" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                未配置
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="langfuse-public">Public Key</Label>
                                <Input
                                    id="langfuse-public"
                                    placeholder="pk-lf-..."
                                    value={apiSettings.langfusePublicKey}
                                    onChange={(e) => setApiSettings(prev => ({ ...prev, langfusePublicKey: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="langfuse-secret">Secret Key</Label>
                                <Input
                                    id="langfuse-secret"
                                    type="password"
                                    placeholder="sk-lf-..."
                                    value={apiSettings.langfuseSecretKey}
                                    onChange={(e) => setApiSettings(prev => ({ ...prev, langfuseSecretKey: e.target.value }))}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            LLM 调用追踪和调试工具
                            <a href="https://cloud.langfuse.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                                注册 Langfuse <ExternalLink className="inline h-3 w-3" />
                            </a>
                        </p>
                    </div>

                    <Separator />

                    {/* Platform APIs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="printful">Printful API Key</Label>
                            <Input
                                id="printful"
                                type="password"
                                placeholder="..."
                                value={apiSettings.printfulKey}
                                onChange={(e) => setApiSettings(prev => ({ ...prev, printfulKey: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="etsy">Etsy API Key</Label>
                            <Input
                                id="etsy"
                                type="password"
                                placeholder="..."
                                value={apiSettings.etsyKey}
                                onChange={(e) => setApiSettings(prev => ({ ...prev, etsyKey: e.target.value }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 系统偏好 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle>系统偏好</CardTitle>
                    </div>
                    <CardDescription>
                        配置工作流行为和通知设置
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>演示模式</Label>
                            <p className="text-sm text-muted-foreground">
                                跳过实际的平台上传操作
                            </p>
                        </div>
                        <Switch
                            checked={preferences.demoMode}
                            onCheckedChange={(checked: boolean) => setPreferences(prev => ({ ...prev, demoMode: checked }))}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>自动质量检查</Label>
                            <p className="text-sm text-muted-foreground">
                                生成设计后自动进行质量评估
                            </p>
                        </div>
                        <Switch
                            checked={preferences.autoQualityCheck}
                            onCheckedChange={(checked: boolean) => setPreferences(prev => ({ ...prev, autoQualityCheck: checked }))}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>人工审核</Label>
                            <p className="text-sm text-muted-foreground">
                                上架前需要人工确认
                            </p>
                        </div>
                        <Switch
                            checked={preferences.humanReview}
                            onCheckedChange={(checked: boolean) => setPreferences(prev => ({ ...prev, humanReview: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 保存按钮 */}
            <div className="flex justify-end">
                <Button size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    保存设置
                </Button>
            </div>

            {/* 提示信息 */}
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                        💡 提示：敏感的 API 密钥建议直接在服务器的 <code className="bg-muted px-1 rounded">.env</code> 文件中配置，
                        此页面仅用于演示和临时配置。
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
