"use client";

import Link from "next/link";
import UserAccountButton from "@/components/basejump/user-account-button";
import { ModeToggle } from "@/components/theme-toggle";
import { 
    Activity, 
    Bell, 
    ChevronLeft,
    ChevronRight,
    Home, 
    Monitor, 
    Settings, 
    Shield, 
    Users 
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    accountSlug: string;
    userName?: string;
    userEmail?: string;
}

export function DashboardLayoutClient({
    children, 
    accountSlug,
    userName,
    userEmail
}: DashboardLayoutClientProps) {
    const [expanded, setExpanded] = useState(false);
    
    // Navigation items
    const navItems = [
        { name: 'Dashboard', href: `/dashboard/${accountSlug}`, icon: Home },
        { name: 'Monitors', href: `/dashboard/${accountSlug}/monitors`, icon: Monitor },
        { name: 'Alerts', href: `/dashboard/${accountSlug}/alerts`, icon: Bell },
        { name: 'Analytics', href: `/dashboard/${accountSlug}/analytics`, icon: Activity },
        { name: 'Team', href: `/dashboard/${accountSlug}/team`, icon: Users },
        { name: 'Security', href: `/dashboard/${accountSlug}/security`, icon: Shield },
    ];
    
    const bottomNavItems = [
        { name: 'Settings', href: `/dashboard/${accountSlug}/settings`, icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div 
                className={`${expanded ? 'w-56' : 'w-16'} bg-background border-r flex flex-col py-4 transition-all duration-300`}
            >
                <div className="flex items-center justify-between px-4 mb-8">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setExpanded(!expanded)}
                        className={`${expanded ? 'flex' : 'hidden'} h-8 w-8`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
                
                <nav className="flex flex-col gap-2 flex-1 px-2">
                    {navItems.map((item) => (
                        <Link 
                            key={item.name}
                            href={item.href} 
                            className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent group ${
                                expanded ? 'justify-start' : 'justify-center'
                            }`}
                        >
                            <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            {expanded && (
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
                
                <div className="mt-auto px-2">
                    {bottomNavItems.map((item) => (
                        <Link 
                            key={item.name}
                            href={item.href} 
                            className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent group ${
                                expanded ? 'justify-start' : 'justify-center'
                            }`}
                        >
                            <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            {expanded && (
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    ))}
                    
                    {!expanded && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setExpanded(true)}
                            className="mt-4 w-full flex justify-center"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-16 border-b flex items-center justify-between px-4 bg-background">
                    <div className="flex items-center gap-2">
                        <Link href={`/dashboard/${accountSlug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <UserAccountButton 
                            userName={userName}
                            userEmail={userEmail}
                        />
                    </div>
                </header>
                
                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
