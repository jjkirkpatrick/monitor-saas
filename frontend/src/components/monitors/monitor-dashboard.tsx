"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, ArrowDown, ArrowUp, Calendar, Clock, Edit, Globe, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MonitorDashboardProps {
    monitor: any;
    accountSlug: string;
}

export default function MonitorDashboard({ monitor, accountSlug }: MonitorDashboardProps) {
    // Mock data for the dashboard
    const uptime = {
        last24Hours: "100%",
        last7Days: "100%",
        last30Days: "100%",
        last365Days: "--.--%"
    };
    
    const responseTime = {
        average: "148 ms",
        minimum: "148 ms",
        maximum: "148 ms"
    };

    return (
        <div className="space-y-6">
            {/* Header with monitor name and actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-900/20 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-semibold">{monitor.name}</h1>
                    {monitor.url && (
                        <a 
                            href={monitor.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-green-500 hover:underline text-sm"
                        >
                            {monitor.url}
                        </a>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Test Notification</Button>
                    <Button variant="outline">Pause</Button>
                    <Link href={`/dashboard/${accountSlug}/monitors/${monitor.id}/edit`}>
                        <Button variant="default" className="flex items-center gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Current status */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Current status</h3>
                        <div className="flex items-center gap-2">
                            <div className="text-xl font-semibold text-green-500">Up</div>
                            <div className="text-sm text-muted-foreground">
                                Currently up for {monitor.last_check_at ? 
                                    formatDistanceToNow(new Date(monitor.last_check_at)) : 
                                    '0h 6m 40s'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Last check */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Last check</h3>
                        <div className="flex items-center gap-2">
                            <div className="text-xl font-semibold">Coming soon</div>
                            <div className="text-sm text-muted-foreground">
                                Checked every {monitor.interval_seconds ? 
                                    `${Math.floor(monitor.interval_seconds / 60)} minutes` : 
                                    '5 minutes'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Last 24 hours */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Last 24 hours</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="text-xl font-semibold">{uptime.last24Hours}</div>
                            </div>
                            <div className="h-2 w-full bg-green-500 rounded-full"></div>
                            <div className="text-sm text-muted-foreground">0 incidents, 0m down</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Domain & SSL */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Domain & SSL</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm">Domain valid until</div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Unlock</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm">SSL certificate valid until</div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Unlock</span>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Available only in <span className="text-yellow-500">Solo, Team</span> and <span className="text-purple-500">Enterprise</span>
                                <span className="text-green-500 hover:underline cursor-pointer ml-1">Upgrade now</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Uptime statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Last 7 days */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Last 7 days</h3>
                        <div className="space-y-2">
                            <div className="text-2xl font-semibold text-green-500">{uptime.last7Days}</div>
                            <div className="text-sm text-muted-foreground">0 incidents, 0m down</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Last 30 days */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Last 30 days</h3>
                        <div className="space-y-2">
                            <div className="text-2xl font-semibold text-green-500">{uptime.last30Days}</div>
                            <div className="text-sm text-muted-foreground">0 incidents, 0m down</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Last 365 days */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Last 365 days</h3>
                        <div className="space-y-2">
                            <div className="text-2xl font-semibold text-muted-foreground">{uptime.last365Days}</div>
                            <div className="flex items-center gap-1">
                                <span className="text-green-500 hover:underline cursor-pointer">Unlock with paid plans</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Response time */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Response time</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Last 24 hours</span>
                        <Button variant="ghost" size="sm">
                            <Calendar className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Response time chart (placeholder) */}
                <Card>
                    <CardContent className="p-4">
                        <div className="h-40 w-full flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <div className="text-sm text-muted-foreground mb-2">Response Time Chart</div>
                                <div className="w-full h-px bg-border mb-2"></div>
                                <div className="w-full flex justify-between">
                                    <div className="text-xs text-muted-foreground">0ms</div>
                                    <div className="text-xs text-muted-foreground">80ms</div>
                                    <div className="text-xs text-muted-foreground">160ms</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Response time stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Average */}
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-900/20 flex items-center justify-center">
                                <Info className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">{responseTime.average}</div>
                                <div className="text-sm text-muted-foreground">Average</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Minimum */}
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-900/20 flex items-center justify-center">
                                <ArrowDown className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">{responseTime.minimum}</div>
                                <div className="text-sm text-muted-foreground">Minimum</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Maximum */}
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-900/20 flex items-center justify-center">
                                <ArrowUp className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">{responseTime.maximum}</div>
                                <div className="text-sm text-muted-foreground">Maximum</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Latest incidents */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Latest incidents</h2>
                <Card>
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                        <div className="text-2xl mb-2">👍 Good job, no incidents</div>
                        <div className="text-sm text-muted-foreground">No incidents so far. Keep it up!</div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional sections like maintenance, notifications, etc. can be added here */}
        </div>
    );
}
