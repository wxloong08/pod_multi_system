'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCreateWorkflow } from "@/hooks";
import { useUIStore } from "@/store";
import {
    Sparkles,
    Palette,
    Target,
    Package,
    Store,
    Loader2,
    ArrowLeft,
    Check
} from "lucide-react";
import Link from "next/link";

const STYLE_OPTIONS = [
    { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple designs' },
    { value: 'vintage', label: 'Vintage', description: 'Retro, nostalgic style' },
    { value: 'cartoon', label: 'Cartoon', description: 'Fun, illustrated look' },
    { value: 'typography', label: 'Typography', description: 'Text-focused designs' },
    { value: 'watercolor', label: 'Watercolor', description: 'Artistic, painted feel' },
    { value: 'geometric', label: 'Geometric', description: 'Modern shapes & patterns' },
];

const PLATFORM_OPTIONS = [
    { value: 'etsy', label: 'Etsy', icon: Store },
    { value: 'amazon', label: 'Amazon', icon: Package },
];

const PRODUCT_OPTIONS = [
    { value: 't-shirt', label: 'T-Shirt' },
    { value: 'mug', label: 'Mug' },
    { value: 'poster', label: 'Poster' },
    { value: 'hoodie', label: 'Hoodie' },
    { value: 'tote-bag', label: 'Tote Bag' },
    { value: 'phone-case', label: 'Phone Case' },
];

export default function NewCampaignPage() {
    const router = useRouter();
    const { addNotification } = useUIStore();
    const createWorkflow = useCreateWorkflow();

    const [formData, setFormData] = useState({
        niche: '',
        style: 'minimalist',
        numDesigns: 5,
        targetPlatforms: ['etsy'],
        productTypes: ['t-shirt', 'mug'],
        humanReview: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await createWorkflow.mutateAsync({
                niche: formData.niche,
                style: formData.style,
                num_designs: formData.numDesigns,
                target_platforms: formData.targetPlatforms,
                product_types: formData.productTypes,
                human_review: formData.humanReview,
            });

            addNotification({
                type: 'success',
                title: 'Workflow Created',
                message: `Started generating ${formData.numDesigns} designs for "${formData.niche}"`,
            });

            // Navigate to dashboard
            router.push('/dashboard');
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Failed to Create Workflow',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    };

    const togglePlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            targetPlatforms: prev.targetPlatforms.includes(platform)
                ? prev.targetPlatforms.filter(p => p !== platform)
                : [...prev.targetPlatforms, platform]
        }));
    };

    const toggleProduct = (product: string) => {
        setFormData(prev => ({
            ...prev,
            productTypes: prev.productTypes.includes(product)
                ? prev.productTypes.filter(p => p !== product)
                : [...prev.productTypes, product]
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
                    <p className="text-muted-foreground">
                        Create a new POD design generation workflow
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Niche Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Target Niche
                        </CardTitle>
                        <CardDescription>
                            Enter the niche market you want to target (e.g., &quot;cat lovers&quot;, &quot;fitness enthusiasts&quot;)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="niche">Niche Market</Label>
                            <Input
                                id="niche"
                                placeholder="e.g., cat lovers, coffee addicts, yoga enthusiasts"
                                value={formData.niche}
                                onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                                required
                                className="max-w-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Style Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            Design Style
                        </CardTitle>
                        <CardDescription>
                            Choose the visual style for your designs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {STYLE_OPTIONS.map(style => (
                                <button
                                    key={style.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, style: style.value }))}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${formData.style === style.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted hover:border-primary/50'
                                        }`}
                                >
                                    <div className="font-medium flex items-center gap-2">
                                        {formData.style === style.value && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                        {style.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {style.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Number of Designs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Generation Settings
                        </CardTitle>
                        <CardDescription>
                            Configure how many designs to generate
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="numDesigns">Number of Designs</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="numDesigns"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={formData.numDesigns}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        numDesigns: parseInt(e.target.value) || 1
                                    }))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">
                                    Estimated cost: ${(formData.numDesigns * 0.04).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="humanReview"
                                checked={formData.humanReview}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    humanReview: e.target.checked
                                }))}
                                className="rounded border-input"
                            />
                            <Label htmlFor="humanReview" className="text-sm font-normal">
                                Require human review before publishing
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            Target Platforms
                        </CardTitle>
                        <CardDescription>
                            Select where to publish your listings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {PLATFORM_OPTIONS.map(platform => {
                                const Icon = platform.icon;
                                const isSelected = formData.targetPlatforms.includes(platform.value);
                                return (
                                    <button
                                        key={platform.value}
                                        type="button"
                                        onClick={() => togglePlatform(platform.value)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-muted hover:border-primary/50'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`} />
                                        {platform.label}
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Product Types */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Product Types
                        </CardTitle>
                        <CardDescription>
                            Select which products to create mockups for
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {PRODUCT_OPTIONS.map(product => (
                                <Badge
                                    key={product.value}
                                    variant={formData.productTypes.includes(product.value) ? "default" : "outline"}
                                    className="cursor-pointer text-sm py-1.5 px-3"
                                    onClick={() => toggleProduct(product.value)}
                                >
                                    {formData.productTypes.includes(product.value) && (
                                        <Check className="h-3 w-3 mr-1" />
                                    )}
                                    {product.label}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4">
                    <Link href="/dashboard">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={!formData.niche || createWorkflow.isPending}
                        className="gap-2"
                    >
                        {createWorkflow.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Start Campaign
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
