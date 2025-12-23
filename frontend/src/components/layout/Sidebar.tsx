"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    PlusCircle,
    Image as ImageIcon,
    ShoppingBag,
    Settings,
    Activity,
    Box
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "New Campaign",
            icon: PlusCircle,
            href: "/campaign/new",
            color: "text-violet-500",
        },
        {
            label: "Designs",
            icon: ImageIcon,
            href: "/designs",
            color: "text-pink-700",
        },
        {
            label: "Products",
            icon: Box,
            href: "/products",
            color: "text-orange-700",
        },
        {
            label: "Listings",
            icon: ShoppingBag,
            href: "/listings",
            color: "text-emerald-500",
        },
        {
            label: "Agent Status",
            icon: Activity,
            href: "/status",
            color: "text-green-700",
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
        },
    ]

    return (
        <div className={cn("pb-12 border-r bg-card h-full", className)}>
            <div className="space-y-4 py-4 h-full flex flex-col">
                <div className="px-3 py-2 flex-1">
                    <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                        <div className="relative w-8 h-8 mr-4">
                            {/* Logo placeholder */}
                            <div className="bg-primary w-full h-full rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                                P
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold">
                            POD Gen
                        </h1>
                    </Link>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={pathname === route.href ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-base font-normal",
                                    pathname === route.href ? "bg-secondary" : "hover:bg-secondary/50",
                                )}
                                asChild
                            >
                                <Link href={route.href}>
                                    <div className={cn("flex items-center flex-1")}>
                                        <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                        {route.label}
                                    </div>
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Current Niche</p>
                        <div className="text-sm font-semibold truncate">Cat Lovers</div>
                        <div className="text-xs text-muted-foreground mt-1">Minimalist Style</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
