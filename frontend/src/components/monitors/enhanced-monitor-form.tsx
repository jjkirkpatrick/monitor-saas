'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormState } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { getMonitorTypes, getMonitor, createMonitor, updateMonitor, toggleMonitorMaintenance, toggleMonitorActive } from "@/lib/actions/monitors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link"; 
import { useParams } from "next/navigation";
import { 
    AlertCircle, 
    ChevronDown, 
    ChevronUp, 
    Clock, 
    Database, 
    Globe, 
    Heart, 
    Info, 
    Mail, 
    MessageSquare, 
    Phone, 
    Radio,
    Search, 
    Server, 
    Shield,
    Signal,
    Smartphone, 
    Tag, 
    X 
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Helper function to get the icon component based on the icon name
const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'Globe': return Globe;
        case 'Signal': return Signal;
        case 'Radio': return Radio;
        case 'Shield': return Shield;
        case 'Heart': return Heart;
        case 'Search': return Search;
        case 'Database': return Database;
        case 'Server': return Server;
        case 'Mail': return Mail;
        case 'MessageSquare': return MessageSquare;
        case 'Phone': return Phone;
        case 'Smartphone': return Smartphone;
        default: return Globe;
    }
};

interface MonitorType {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    category_name: string;
    configuration_schema: any;
    settings_schema: any;
    is_premium: boolean;
    icon_color: string;
}

interface EnhancedMonitorFormProps {
    action: (formData: FormData) => Promise<{ success?: boolean; message?: string; data?: any }>;
    initialData?: any;
}

export default function EnhancedMonitorForm({ action, initialData }: EnhancedMonitorFormProps) {
    const [state, formAction] = useFormState((prevState: any, formData: FormData) => action(formData), {});
    const [tags, setTags] = useState<string>(initialData?.tags?.join(',') || '');
    const params = useParams();
    const accountSlug = params.accountSlug as string;
    const [monitorType, setMonitorType] = useState(initialData?.monitor_type_id || "http");
    const [monitorTypes, setMonitorTypes] = useState<MonitorType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [severity, setSeverity] = useState(initialData?.severity || "medium");
    
    // Fetch monitor types
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch monitor types
                const types = await getMonitorTypes();
                setMonitorTypes(types);
            } catch (error) {
                console.error("Error fetching monitor types:", error);
            } finally {
                setIsLoadingTypes(false);
            }
        };
        
        fetchData();
    }, []);

    // Get selected monitor type
    const selectedMonitorType = monitorTypes.find(type => type.id === monitorType);
    
    // State for maintenance mode
    const [maintenanceMode, setMaintenanceMode] = useState(initialData?.maintenance_mode || false);
    const [maintenanceUntil, setMaintenanceUntil] = useState<Date | undefined>(
        initialData?.maintenance_until ? new Date(initialData.maintenance_until) : undefined
    );
    
    // State for active status
    const [isActive, setIsActive] = useState(initialData?.active !== false);
    
    // Handle maintenance mode toggle
    const handleMaintenanceModeToggle = async (checked: boolean) => {
        if (initialData?.id) {
            const result = await toggleMonitorMaintenance(initialData.id, checked, maintenanceUntil);
            if (result.success) {
                setMaintenanceMode(checked);
            }
        }
    };

    // Handle active status toggle
    const handleActiveStatusToggle = async (checked: boolean) => {
        if (initialData?.id) {
            const result = await toggleMonitorActive(initialData.id, checked);
            if (result.success) {
                setIsActive(checked);
            }
        }
    };

    // Handle maintenance until date change
    const handleMaintenanceUntilChange = async (date: Date | undefined) => {
        if (date) {
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            setMaintenanceUntil(endOfDay);
            
            if (initialData?.id && maintenanceMode) {
                await toggleMonitorMaintenance(initialData.id, true, endOfDay);
            }
        } else {
            setMaintenanceUntil(undefined);
            if (initialData?.id && maintenanceMode) {
                await toggleMonitorMaintenance(initialData.id, true, undefined);
            }
        }
    };
    
    // State for collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        monitorType: true,
        basicSettings: true,
        interval: true,
        thresholds: true,
        ssl: monitorType === 'http',
        maintenance: true,
        typeSpecific: true,
        advanced: false,
        tags: true
    });
    
    // State for monitor interval
    const [intervalSeconds, setIntervalSeconds] = useState(initialData?.interval_seconds || 300);
    const [intervalLabel, setIntervalLabel] = useState("5 minutes");
    
    // State for alert thresholds
    const [alertAfterFailures, setAlertAfterFailures] = useState(initialData?.alert_after_failures || 1);
    const [alertRecoveryThreshold, setAlertRecoveryThreshold] = useState(initialData?.alert_recovery_threshold || 1);
    
    // Ref for the slider thumb
    const sliderRef = useRef<HTMLDivElement>(null);
    
    // Update interval label when interval changes
    useEffect(() => {
        if (intervalSeconds < 60) {
            setIntervalLabel(`${intervalSeconds} seconds`);
        } else if (intervalSeconds < 3600) {
            setIntervalLabel(`${Math.floor(intervalSeconds / 60)} minutes`);
        } else if (intervalSeconds < 86400) {
            setIntervalLabel(`${Math.floor(intervalSeconds / 3600)} hours`);
        } else {
            setIntervalLabel(`${Math.floor(intervalSeconds / 86400)} days`);
        }
    }, [intervalSeconds]);
    
    // Expand type-specific section when monitor type changes
    useEffect(() => {
        setExpandedSections(prev => ({
            ...prev,
            typeSpecific: true,
            ssl: monitorType === 'http'
        }));
    }, [monitorType]);
    
    // Function to toggle section expansion
    const toggleSection = (section: string) => {
        setExpandedSections({
            ...expandedSections,
            [section]: !expandedSections[section as keyof typeof expandedSections]
        });
    };
    
    // Function to convert from linear slider value to actual seconds
    const sliderToSeconds = (sliderValue: number): number => {
        // Get preset intervals
        const presets = getPresetIntervals();
        
        // Find the closest preset points
        const presetPoints = presets.map(p => ({
            value: p.value,
            position: (presets.findIndex(x => x.value === p.value) / (presets.length - 1)) * 100
        }));
        
        // Find the two closest preset points
        const lowerPoint = presetPoints.reduce((prev, curr) => 
            curr.position <= sliderValue ? curr : prev, presetPoints[0]
        );
        const upperPoint = presetPoints.reduce((prev, curr) => 
            curr.position >= sliderValue && curr.position < prev.position ? curr : prev
        , presetPoints[presetPoints.length - 1]);
        
        // If we're exactly on a preset point, return that value
        if (Math.abs(sliderValue - lowerPoint.position) < 0.1) {
            return lowerPoint.value;
        }
        
        // Interpolate between the two points using logarithmic scale
        const t = (sliderValue - lowerPoint.position) / (upperPoint.position - lowerPoint.position);
        const logLower = Math.log(lowerPoint.value);
        const logUpper = Math.log(upperPoint.value);
        return Math.round(Math.exp(logLower + t * (logUpper - logLower)));
    };

    // Function to convert from seconds to linear slider value
    const secondsToSlider = (seconds: number): number => {
        const presets = getPresetIntervals();
        
        // If the seconds value matches a preset exactly, return its position
        const presetIndex = presets.findIndex(p => Math.abs(p.value - seconds) < 0.1);
        if (presetIndex !== -1) {
            return (presetIndex / (presets.length - 1)) * 100;
        }
        
        // Find the surrounding preset points
        const lowerPreset = presets.reduce((prev, curr) => 
            curr.value <= seconds ? curr : prev, presets[0]
        );
        const upperPreset = presets.reduce((prev, curr) => 
            curr.value >= seconds ? curr : presets[presets.length - 1]
        );
        
        const lowerPosition = (presets.findIndex(p => p.value === lowerPreset.value) / (presets.length - 1)) * 100;
        const upperPosition = (presets.findIndex(p => p.value === upperPreset.value) / (presets.length - 1)) * 100;
        
        // Interpolate between the two points using logarithmic scale
        const logValue = Math.log(seconds);
        const logLower = Math.log(lowerPreset.value);
        const logUpper = Math.log(upperPreset.value);
        const t = (logValue - logLower) / (logUpper - logLower);
        
        return lowerPosition + t * (upperPosition - lowerPosition);
    };

    // Function to handle interval slider change
    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sliderValue = parseFloat(e.target.value);
        const seconds = sliderToSeconds(sliderValue);
        
        // Ensure seconds is within valid range
        const minSeconds = 30;
        const maxSeconds = 86400;
        const validSeconds = Math.max(minSeconds, Math.min(maxSeconds, seconds));
        
        setIntervalSeconds(validSeconds);
        
        // Update slider thumb position
        if (sliderRef.current) {
            sliderRef.current.style.left = `${sliderValue}%`;
        }
    };
    
    // Function to get preset interval values
    const getPresetIntervals = () => [
        { label: "30s", value: 30 },
        { label: "1m", value: 60 },
        { label: "5m", value: 300 },
        { label: "30m", value: 1800 },
        { label: "1h", value: 3600 },
        { label: "12h", value: 43200 },
        { label: "24h", value: 86400 }
    ];
    
    // Function to set interval to a preset value
    const setPresetInterval = (value: number) => {
        setIntervalSeconds(value);
        
        // Update slider thumb position
        if (sliderRef.current) {
            sliderRef.current.style.left = `${secondsToSlider(value)}%`;
        }
    };

    // HTTP-specific state
    const [httpSettings, setHttpSettings] = useState({
        url: initialData?.extension?.url || '',
        method: initialData?.extension?.method || 'GET',
        headers: initialData?.extension?.headers || {},
        body: initialData?.extension?.body || '',
        expectedStatusCode: initialData?.extension?.expected_status_code || 200,
        verifySSL: initialData?.extension?.verify_ssl !== false,
        followRedirects: initialData?.extension?.follow_redirects !== false,
        maxRedirects: initialData?.extension?.max_redirects || 5,
        contentMatch: initialData?.extension?.content_match || '',
        contentMatchMode: initialData?.extension?.content_match_mode || 'contains',
        basicAuthUser: initialData?.extension?.basic_auth_user || '',
        basicAuthPassword: initialData?.extension?.basic_auth_password || ''
    });


    // Ping-specific state
    const [pingSettings, setPingSettings] = useState({
        host: initialData?.extension?.host || '',
        packetCount: initialData?.extension?.packet_count || 4,
        packetSize: initialData?.extension?.packet_size || 56,
        maxLatencyMs: initialData?.extension?.max_latency_ms || 500,
        maxPacketLossPercent: initialData?.extension?.max_packet_loss_percent || 10
    });

    // Port-specific state
    const [portSettings, setPortSettings] = useState({
        host: initialData?.extension?.host || '',
        port: initialData?.extension?.port || 80,
        sendString: initialData?.extension?.send_string || '',
        expectedResponse: initialData?.extension?.expected_response || '',
        expectStringMatchMode: initialData?.extension?.expect_string_match_mode || 'contains'
    });

    // DNS-specific state
    const [dnsSettings, setDnsSettings] = useState({
        hostname: initialData?.extension?.hostname || '',
        recordType: initialData?.extension?.record_type || 'A',
        nameserver: initialData?.extension?.nameserver || '',
        expectedIp: initialData?.extension?.expected_ip?.join(',') || '',
        expectedValue: initialData?.extension?.expected_value || '',
        checkPropagation: initialData?.extension?.check_propagation || false
    });

    // Get monitor type configuration fields
    const getTypeConfigFields = () => {
        switch (monitorType) {
            case 'http':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url" className="text-base font-medium">URL to Monitor</Label>
                            <Input 
                                id="url" 
                                name="url" 
                                type="url" 
                                value={httpSettings.url}
                                onChange={(e) => setHttpSettings({...httpSettings, url: e.target.value})}
                                required 
                                placeholder={httpSettings.url || "https://example.com"}
                                className="bg-background border-border"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="method" className="text-base font-medium">HTTP Method</Label>
                                <Select 
                                    name="method"
                                    value={httpSettings.method}
                                    onValueChange={(value) => setHttpSettings({...httpSettings, method: value})}
                                >
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="HEAD">HEAD</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                        <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="expectedStatusCode" className="text-base font-medium">Expected Status Code</Label>
                                <Input 
                                    id="expectedStatusCode" 
                                    name="expectedStatusCode" 
                                    type="number" 
                                    value={httpSettings.expectedStatusCode}
                                    onChange={(e) => setHttpSettings({...httpSettings, expectedStatusCode: parseInt(e.target.value)})}
                                    placeholder="200" 
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="verifySSL" className="text-base font-medium">Verify SSL Certificate</Label>
                                <Switch 
                                    id="verifySSL" 
                                    name="verifySSL" 
                                    checked={httpSettings.verifySSL}
                                    onCheckedChange={(checked) => setHttpSettings({...httpSettings, verifySSL: checked})}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                When enabled, the monitor will verify the SSL certificate of the website.
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="followRedirects" className="text-base font-medium">Follow Redirects</Label>
                                <Switch 
                                    id="followRedirects" 
                                    name="followRedirects" 
                                    checked={httpSettings.followRedirects}
                                    onCheckedChange={(checked) => setHttpSettings({...httpSettings, followRedirects: checked})}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                When enabled, the monitor will follow HTTP redirects.
                            </div>
                        </div>
                        
                        {httpSettings.followRedirects && (
                            <div className="space-y-2">
                                <Label htmlFor="maxRedirects" className="text-base font-medium">Max Redirects</Label>
                                <Input 
                                    id="maxRedirects" 
                                    name="maxRedirects" 
                                    type="number" 
                                    value={httpSettings.maxRedirects}
                                    onChange={(e) => setHttpSettings({...httpSettings, maxRedirects: parseInt(e.target.value)})}
                                    placeholder="5" 
                                    className="bg-background border-border"
                                />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="contentMatch" className="text-base font-medium">Content Match</Label>
                            <div className="text-sm text-muted-foreground mb-2">
                                Optional. Specify text to search for in the response body.
                            </div>
                            <Input 
                                id="contentMatch" 
                                name="contentMatch" 
                                value={httpSettings.contentMatch}
                                onChange={(e) => setHttpSettings({...httpSettings, contentMatch: e.target.value})}
                                placeholder="Search text" 
                                className="bg-background border-border"
                            />
                        </div>
                        
                        {httpSettings.contentMatch && (
                            <div className="space-y-2">
                                <Label htmlFor="contentMatchMode" className="text-base font-medium">Match Mode</Label>
                                <Select 
                                    name="contentMatchMode"
                                    value={httpSettings.contentMatchMode}
                                    onValueChange={(value) => setHttpSettings({...httpSettings, contentMatchMode: value})}
                                >
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="not_contains">Does not contain</SelectItem>
                                        <SelectItem value="regex">Regex match</SelectItem>
                                        <SelectItem value="not_regex">Regex does not match</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="headers" className="text-base font-medium">Custom Headers</Label>
                            <div className="text-sm text-muted-foreground mb-2">
                                Optional. Add custom headers in JSON format.
                            </div>
                            <Textarea 
                                id="headers" 
                                name="headers" 
                                value={JSON.stringify(httpSettings.headers, null, 2)}
                                onChange={(e) => {
                                    try {
                                        setHttpSettings({...httpSettings, headers: JSON.parse(e.target.value)});
                                    } catch (error) {
                                        // Invalid JSON, keep as is
                                    }
                                }}
                                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                                className="bg-background border-border font-mono text-sm h-24"
                            />
                        </div>
                        
                        {(httpSettings.method === 'POST' || httpSettings.method === 'PUT') && (
                            <div className="space-y-2">
                                <Label htmlFor="body" className="text-base font-medium">Request Body</Label>
                                <Textarea 
                                    id="body" 
                                    name="body" 
                                    value={httpSettings.body}
                                    onChange={(e) => setHttpSettings({...httpSettings, body: e.target.value})}
                                    placeholder="Request body content"
                                    className="bg-background border-border h-24"
                                />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Basic Authentication</Label>
                            <div className="text-sm text-muted-foreground mb-2">
                                Optional. Provide credentials for HTTP Basic Authentication.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    id="basicAuthUser" 
                                    name="basicAuthUser" 
                                    value={httpSettings.basicAuthUser}
                                    onChange={(e) => setHttpSettings({...httpSettings, basicAuthUser: e.target.value})}
                                    placeholder="Username" 
                                    className="bg-background border-border"
                                />
                                <Input 
                                    id="basicAuthPassword" 
                                    name="basicAuthPassword" 
                                    type="password"
                                    value={httpSettings.basicAuthPassword}
                                    onChange={(e) => setHttpSettings({...httpSettings, basicAuthPassword: e.target.value})}
                                    placeholder="Password" 
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                    </div>
                );
                
            case 'ping':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="host" className="text-base font-medium">Host to Ping</Label>
                            <Input 
                                id="host" 
                                name="host" 
                                value={pingSettings.host}
                                onChange={(e) => setPingSettings({...pingSettings, host: e.target.value})}
                                required 
                                placeholder="example.com or 192.168.1.1" 
                                className="bg-background border-border"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="packetCount" className="text-base font-medium">Packet Count</Label>
                                <Input 
                                    id="packetCount" 
                                    name="packetCount" 
                                    type="number" 
                                    value={pingSettings.packetCount}
                                    onChange={(e) => setPingSettings({...pingSettings, packetCount: parseInt(e.target.value)})}
                                    placeholder="4" 
                                    className="bg-background border-border"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="packetSize" className="text-base font-medium">Packet Size (bytes)</Label>
                                <Input 
                                    id="packetSize" 
                                    name="packetSize" 
                                    type="number" 
                                    value={pingSettings.packetSize}
                                    onChange={(e) => setPingSettings({...pingSettings, packetSize: parseInt(e.target.value)})}
                                    placeholder="56" 
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="maxLatencyMs" className="text-base font-medium">Max Latency (ms)</Label>
                                <Input 
                                    id="maxLatencyMs" 
                                    name="maxLatencyMs" 
                                    type="number" 
                                    value={pingSettings.maxLatencyMs}
                                    onChange={(e) => setPingSettings({...pingSettings, maxLatencyMs: parseInt(e.target.value)})}
                                    placeholder="500" 
                                    className="bg-background border-border"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="maxPacketLossPercent" className="text-base font-medium">Max Packet Loss (%)</Label>
                                <Input 
                                    id="maxPacketLossPercent" 
                                    name="maxPacketLossPercent" 
                                    type="number" 
                                    value={pingSettings.maxPacketLossPercent}
                                    onChange={(e) => setPingSettings({...pingSettings, maxPacketLossPercent: parseInt(e.target.value)})}
                                    placeholder="10" 
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                    </div>
                );
                
            case 'port':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host" className="text-base font-medium">Host</Label>
                                <Input 
                                    id="host" 
                                    name="host" 
                                    value={portSettings.host}
                                    onChange={(e) => setPortSettings({...portSettings, host: e.target.value})}
                                    required 
                                    placeholder="example.com or 192.168.1.1" 
                                    className="bg-background border-border"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="port" className="text-base font-medium">Port</Label>
                                <Input 
                                    id="port" 
                                    name="port" 
                                    type="number" 
                                    value={portSettings.port}
                                    onChange={(e) => setPortSettings({...portSettings, port: parseInt(e.target.value)})}
                                    required 
                                    placeholder="80" 
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="sendString" className="text-base font-medium">String to Send</Label>
                            <div className="text-sm text-muted-foreground mb-2">
                                Optional. Specify a string to send after connection is established.
                            </div>
                            <Input 
                                id="sendString" 
                                name="sendString" 
                                value={portSettings.sendString}
                                onChange={(e) => setPortSettings({...portSettings, sendString: e.target.value})}
                                placeholder="String to send" 
                                className="bg-background border-border"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="expectedResponse" className="text-base font-medium">Expected Response</Label>
                            <div className="text-sm text-muted-foreground mb-2">
                                Optional. Specify text to expect in the response.
                            </div>
                            <Input 
                                id="expectedResponse" 
                                name="expectedResponse" 
                                value={portSettings.expectedResponse}
                                onChange={(e) => setPortSettings({...portSettings, expectedResponse: e.target.value})}
                                placeholder="Expected response" 
                                className="bg-background border-border"
                            />
                        </div>
                        
                        {portSettings.expectedResponse && (
                            <div className="space-y-2">
                                <Label htmlFor="expectStringMatchMode" className="text-base font-medium">Match Mode</Label>
                                <Select 
                                    name="expectStringMatchMode"
                                    value={portSettings.expectStringMatchMode}
                                    onValueChange={(value) => setPortSettings({...portSettings, expectStringMatchMode: value})}
                                >
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="not_contains">Does not contain</SelectItem>
                                        <SelectItem value="regex">Regex match</SelectItem>
                                        <SelectItem value="not_regex">Regex does not match</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                );
                
            case 'dns':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hostname" className="text-base font-medium">Hostname</Label>
                            <Input 
                                id="hostname" 
                                name="hostname" 
                                value={dnsSettings.hostname}
                                onChange={(e) => setDnsSettings({...dnsSettings, hostname: e.target.value})}
                                required 
                                placeholder="example.com" 
                                className="bg-background border-border"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="recordType" className="text-base font-medium">Record Type</Label>
                            <Select 
                                name="recordType"
                                value={dnsSettings.recordType}
                                onValueChange={(value) => setDnsSettings({...dnsSettings, recordType: value})}
                            >
                                <SelectTrigger className="bg-background border-border">
                                    <SelectValue placeholder="Select record type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="AAAA">AAAA</SelectItem>
                                    <SelectItem value="CNAME">CNAME</SelectItem>
                                    <SelectItem value="MX">MX</SelectItem>
                                    <SelectItem value="TXT">TXT</SelectItem>
                                    <SelectItem value="NS">NS</SelectItem>
                                    <SelectItem value="SOA">SOA</SelectItem>
                                    <SelectItem value="SRV">SRV</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="nameserver" className="text-base font-medium">Nameserver (Optional)</Label>
                            <Input 
                                id="nameserver" 
                                name="nameserver" 
                                value={dnsSettings.nameserver}
                                onChange={(e) => setDnsSettings({...dnsSettings, nameserver: e.target.value})}
                                placeholder="ns1.example.com" 
                                className="bg-background border-border"
                            />
                        </div>
                        
                        {(dnsSettings.recordType === 'A' || dnsSettings.recordType === 'AAAA') && (
                            <div className="space-y-2">
                                <Label htmlFor="expectedIp" className="text-base font-medium">Expected IP Addresses</Label>
                                <div className="text-sm text-muted-foreground mb-2">
                                    Optional. Comma-separated list of expected IP addresses.
                                </div>
                                <Input 
                                    id="expectedIp" 
                                    name="expectedIp" 
                                    value={dnsSettings.expectedIp}
                                    onChange={(e) => setDnsSettings({...dnsSettings, expectedIp: e.target.value})}
                                    placeholder="192.168.1.1, 10.0.0.1" 
                                    className="bg-background border-border"
                                />
                            </div>
                        )}
                        
                        {dnsSettings.recordType !== 'A' && dnsSettings.recordType !== 'AAAA' && (
                            <div className="space-y-2">
                                <Label htmlFor="expectedValue" className="text-base font-medium">Expected Value</Label>
                                <div className="text-sm text-muted-foreground mb-2">
                                    Optional. The expected record value.
                                </div>
                                <Input 
                                    id="expectedValue" 
                                    name="expectedValue" 
                                    value={dnsSettings.expectedValue}
                                    onChange={(e) => setDnsSettings({...dnsSettings, expectedValue: e.target.value})}
                                    placeholder="Expected record value" 
                                    className="bg-background border-border"
                                />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="checkPropagation" className="text-base font-medium">Check Propagation</Label>
                                <Switch 
                                    id="checkPropagation" 
                                    name="checkPropagation" 
                                    checked={dnsSettings.checkPropagation}
                                    onCheckedChange={(checked) => setDnsSettings({...dnsSettings, checkPropagation: checked})}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                When enabled, checks DNS record propagation across multiple nameservers.
                            </div>
                        </div>
                    </div>
                );
                
            default:
                return (
                    <div className="text-center py-8">
                        <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Please select a monitor type to configure specific settings.</p>
                    </div>
                );
        }
    };
    
    return (
        <form action={formAction} className="min-h-[calc(100vh-4rem)]">
            {state.message && (
                <div className="bg-red-900/20 text-red-400 p-3 rounded-md mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {state.message}
                </div>
            )}

            {/* Header with actions */}
            <div className="sticky top-0 z-10 bg-background border-b mb-6">
                <div className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">{initialData ? 'Edit Monitor' : 'Add Monitor'}</h1>
                            <p className="text-muted-foreground">Configure your monitor settings</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Link href={initialData ? `/dashboard/${accountSlug}/monitors/${initialData.id}` : `/dashboard/${accountSlug}/monitors`}>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" className="px-6">{initialData ? 'Save Changes' : 'Create Monitor'}</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Main settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Monitor Type Section */}
                        <Card className="overflow-hidden border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('monitorType')}
                            >
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-green-500" />
                                    Monitor Type
                                </CardTitle>
                                {expandedSections.monitorType ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.monitorType && (
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {isLoadingTypes ? (
                                                <div className="col-span-2 py-8 text-center">
                                                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent"></div>
                                                    <p className="mt-2 text-sm text-muted-foreground">Loading monitor types...</p>
                                                </div>
                                            ) : (
                                                monitorTypes.map((type) => {
                                                    const isSelected = monitorType === type.id;
                                                    const isPro = type.is_premium;
                                                    const IconComponent = getIconComponent(type.icon);
                                                    
                                                    return (
                                                        <Card 
                                                            key={type.id}
                                                            className={`${isSelected ? 'border-2 border-green-500 bg-green-500/5' : 'border border-border'} 
                                                                      ${isPro ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                            onClick={() => !isPro && setMonitorType(type.id)}
                                                        >
                                                            <CardContent className="p-4 flex items-center gap-4">
                                                                <div className={`h-12 w-12 rounded-full flex items-center justify-center`}
                                                                     style={{ backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.2)' : `${type.icon_color}20` }}>
                                                                    <IconComponent className={`h-6 w-6`} 
                                                                                   style={{ color: isSelected ? 'rgb(34, 197, 94)' : type.icon_color }} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="font-medium">{type.name}</h3>
                                                                    <p className="text-sm text-muted-foreground">{type.description}</p>
                                                                </div>
                                                                {isPro && (
                                                                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full">Pro</span>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        {/* Basic Settings Section */}
                        <Card className="overflow-hidden border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('basicSettings')}
                            >
                                <CardTitle className="text-lg font-medium">Basic Settings</CardTitle>
                                {expandedSections.basicSettings ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.basicSettings && (
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-base font-medium">Monitor Name</Label>
                                        <Input 
                                            id="name" 
                                            name="name" 
                                            defaultValue={initialData?.name || ''} 
                                            required 
                                            placeholder="My Website Monitor" 
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-base font-medium">Description (Optional)</Label>
                                        <Textarea 
                                            id="description" 
                                            name="description" 
                                            defaultValue={initialData?.description || ''} 
                                            placeholder="Describe the purpose of this monitor" 
                                            className="bg-background border-border resize-none h-24"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="severity" className="text-base font-medium">Severity</Label>
                                        <Select 
                                            name="severity"
                                            value={severity}
                                            onValueChange={setSeverity}
                                        >
                                            <SelectTrigger className="bg-background border-border">
                                                <SelectValue placeholder="Select severity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="text-sm text-muted-foreground">
                                            The severity level determines the urgency of alerts and helps with prioritization.
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        {/* Type-Specific Settings */}
                        <Card className="overflow-hidden border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('typeSpecific')}
                            >
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    {(() => {
                                        const IconComponent = getIconComponent(selectedMonitorType?.icon || 'Globe');
                                        return <IconComponent className="h-5 w-5" style={{ color: selectedMonitorType?.icon_color || '#4f46e5' }} />;
                                    })()}
                                    {selectedMonitorType?.name || 'Type-Specific'} Settings
                                </CardTitle>
                                {expandedSections.typeSpecific ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.typeSpecific && (
                                <CardContent className="p-6">
                                    {getTypeConfigFields()}
                                </CardContent>
                            )}
                        </Card>

                        {/* Monitor Interval Section */}
                        <Card className="overflow-hidden border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('interval')}
                            >
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    Monitor Interval
                                </CardTitle>
                                {expandedSections.interval ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.interval && (
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-medium">Check frequency</Label>
                                            <div className="text-sm text-muted-foreground">
                                                We recommend to use at least 1-minute checks 
                                                <span className="text-green-500 hover:underline cursor-pointer ml-1">available in paid plans</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {/* Interval presets */}
                                            <div className="flex flex-wrap gap-2">
                                                {getPresetIntervals().map((interval) => (
                                                    <Button
                                                        key={interval.value}
                                                        type="button"
                                                        variant={intervalSeconds === interval.value ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPresetInterval(interval.value)}
                                                        className={intervalSeconds === interval.value ? "bg-blue-500 hover:bg-blue-600" : ""}
                                                    >
                                                        {interval.label}
                                                    </Button>
                                                ))}
                                            </div>
                                            
                                            {/* Custom slider */}
                                            <div className="space-y-4">
                                                <div className="relative h-8">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-blue-500 rounded-full" 
                                                                style={{ width: `${secondsToSlider(intervalSeconds)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div 
                                                        ref={sliderRef}
                                                        className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-blue-500 rounded-full shadow-md flex items-center justify-center cursor-pointer"
                                                        style={{ left: `${secondsToSlider(intervalSeconds)}%` }}
                                                    >
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    </div>
                                                    
                                                    <input 
                                                        type="range" 
                                                        min="0" 
                                                        max="100" 
                                                        step="1" 
                                                        value={secondsToSlider(intervalSeconds)}
                                                        onChange={handleIntervalChange}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                                
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>30s</span>
                                                    <span>1m</span>
                                                    <span>5m</span>
                                                    <span>30m</span>
                                                    <span>1h</span>
                                                    <span>12h</span>
                                                    <span>24h</span>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <span className="text-lg font-medium">Your monitor will be checked every </span>
                                                    <span className="text-lg font-bold text-blue-500">{intervalLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        {/* Alert Thresholds Section */}
                        <Card className="overflow-hidden border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('thresholds')}
                            >
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    Alert Thresholds
                                </CardTitle>
                                {expandedSections.thresholds ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.thresholds && (
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="alertAfterFailures" className="text-base font-medium">Alert After Failures</Label>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                The number of consecutive failures before sending an alert.
                                            </div>
                                            <Select 
                                                name="alertAfterFailures"
                                                value={alertAfterFailures.toString()}
                                                onValueChange={(value) => setAlertAfterFailures(parseInt(value))}
                                            >
                                                <SelectTrigger className="w-40 bg-background border-border">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 failure</SelectItem>
                                                    <SelectItem value="2">2 failures</SelectItem>
                                                    <SelectItem value="3">3 failures</SelectItem>
                                                    <SelectItem value="5">5 failures</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="alertRecoveryThreshold" className="text-base font-medium">Recovery Threshold</Label>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                The number of consecutive successful checks required before considering the monitor recovered.
                                            </div>
                                            <Select 
                                                name="alertRecoveryThreshold"
                                                value={alertRecoveryThreshold.toString()}
                                                onValueChange={(value) => setAlertRecoveryThreshold(parseInt(value))}
                                            >
                                                <SelectTrigger className="w-40 bg-background border-border">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 success</SelectItem>
                                                    <SelectItem value="2">2 successes</SelectItem>
                                                    <SelectItem value="3">3 successes</SelectItem>
                                                    <SelectItem value="5">5 successes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        {/* Maintenance Mode Section */}
                        <Card className="border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('maintenance')}
                            >
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    {/* <Calendar className="h-5 w-5 text-purple-500" /> */}
                                    Maintenance & Status
                                </CardTitle>
                                {expandedSections.maintenance ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.maintenance && (
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Monitor Status Toggle */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label htmlFor="active" className="text-base font-medium">Monitor Status</Label>
                                                <Switch 
                                                    id="active" 
                                                    name="active" 
                                                    checked={isActive}
                                                    onCheckedChange={handleActiveStatusToggle}
                                                />
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {isActive ? 'Your monitor is active and will be checked on schedule.' : 'Your monitor is inactive and will not be checked.'}
                                            </div>
                                        </div>
                                        
                                        {/* Maintenance Mode Toggle */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label htmlFor="maintenanceMode" className="text-base font-medium">Maintenance Mode</Label>
                                                <Switch 
                                                    id="maintenanceMode" 
                                                    name="maintenanceMode" 
                                                    checked={maintenanceMode}
                                                    onCheckedChange={handleMaintenanceModeToggle}
                                                />
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                When in maintenance mode, the monitor will continue to run but won't trigger alerts.
                                            </div>
                                        </div>
                                        
                                        {/* Date Picker (Only visible when maintenance mode is enabled) */}
                                        {maintenanceMode && (
                                            <div className="mt-4">
                                                <Label htmlFor="maintenanceUntil" className="text-base font-medium mb-2 block">Schedule End Time (Optional)</Label>
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    Maintenance mode will automatically end at the specified time.
                                                </div>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                            {maintenanceUntil ? (
                                                                maintenanceUntil.toLocaleDateString(undefined, {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                })
                                                            ) : (
                                                                "Pick a date"
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={maintenanceUntil}
                                                            onSelect={handleMaintenanceUntilChange}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        {/* Tags Section */}
                        <Card className="overflow-hidden border-border">
                            <CardHeader 
                                className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between p-4"
                                onClick={() => toggleSection('tags')}
                            >
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Tag className="h-5 w-5 text-green-500" />
                                    Tags
                                </CardTitle>
                                {expandedSections.tags ? 
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                }
                            </CardHeader>
                            
                            {expandedSections.tags && (
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="text-sm text-muted-foreground">
                                            Optional. Use tags to group monitors, making it easier to manage them in bulk or organize on status pages.
                                        </div>
                                        <Input 
                                            id="tags" 
                                            name="tags" 
                                            value={tags} 
                                            onChange={(e) => setTags(e.target.value)} 
                                            placeholder="production, api, website, etc. (comma separated)" 
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                    
                    {/* Right column - Summary and Help */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg font-medium">Monitor Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Type</div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const IconComponent = getIconComponent(selectedMonitorType?.icon || 'Globe');
                                        return <IconComponent className="h-4 w-4" style={{ color: selectedMonitorType?.icon_color || '#4f46e5' }} />;
                                    })()}
                                    <span>{selectedMonitorType?.name || 'HTTP/Website'}</span>
                                </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Check Frequency</div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span>{intervalLabel}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Status</div>
                                    <div className="flex flex-wrap gap-2">
                                        {isActive ? (
                                            <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs">
                                                <span>Active</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full text-xs">
                                                <span>Inactive</span>
                                            </div>
                                        )}
                                        
                                        {maintenanceMode && (
                                            <div className="flex items-center gap-1 bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full text-xs">
                                                <span>Maintenance</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Severity</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${
                                            severity === 'low' ? 'bg-blue-500' :
                                            severity === 'medium' ? 'bg-yellow-500' :
                                            severity === 'high' ? 'bg-orange-500' :
                                            'bg-red-500'
                                        }`}></span>
                                        <span className="capitalize">{severity}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg font-medium">Monitor Type Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {selectedMonitorType ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const IconComponent = getIconComponent(selectedMonitorType.icon);
                                                return (
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center" 
                                                         style={{ backgroundColor: `${selectedMonitorType.icon_color}20` }}>
                                                        <IconComponent className="h-5 w-5" style={{ color: selectedMonitorType.icon_color }} /></div>
                                                );
                                            })()}
                                            <div>
                                                <h3 className="font-medium">{selectedMonitorType.name}</h3>
                                                <p className="text-xs text-muted-foreground">{selectedMonitorType.category_name}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedMonitorType.description}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Please select a monitor type to see more information.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg font-medium">Need Help?</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <h3 className="font-medium">Documentation</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Check our documentation for detailed information about monitor settings and best practices.
                                    </p>
                                    <Button variant="outline" className="w-full">View Documentation</Button>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="font-medium">Support</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Need assistance? Our support team is ready to help you.
                                    </p>
                                    <Button variant="outline" className="w-full">Contact Support</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
            {/* Hidden inputs for form submission */}
            <input type="hidden" name="accountId" value={accountSlug} />
            {initialData?.id && <input type="hidden" name="monitorId" value={initialData.id} />}
            <input type="hidden" name="monitorType" value={monitorType} />
            <input type="hidden" name="intervalSeconds" value={intervalSeconds.toString()} />
            <input type="hidden" name="alertAfterFailures" value={alertAfterFailures.toString()} />
            <input type="hidden" name="alertRecoveryThreshold" value={alertRecoveryThreshold.toString()} />
            <input type="hidden" name="active" value={isActive.toString()} />
            <input type="hidden" name="maintenanceMode" value={maintenanceMode.toString()} />
            <input type="hidden" name="maintenanceUntil" value={maintenanceUntil?.toISOString() || ''} />
            <input type="hidden" name="severity" value={severity} />
            
            {/* Type-specific configuration */}
            {monitorType === 'http' && (
                <>
                    <input type="hidden" name="configuration" value={JSON.stringify({
                        url: httpSettings.url,
                        method: httpSettings.method,
                        headers: httpSettings.headers,
                        body: httpSettings.body,
                        expectedStatusCode: httpSettings.expectedStatusCode,
                        verifySSL: httpSettings.verifySSL,
                        followRedirects: httpSettings.followRedirects,
                        maxRedirects: httpSettings.maxRedirects,
                        contentMatch: httpSettings.contentMatch,
                        contentMatchMode: httpSettings.contentMatchMode,
                        basicAuthUser: httpSettings.basicAuthUser,
                        basicAuthPassword: httpSettings.basicAuthPassword
                    })} />
                </>
            )}
            
            {monitorType === 'ping' && (
                <>
                    <input type="hidden" name="configuration" value={JSON.stringify({
                        host: pingSettings.host,
                        packetCount: pingSettings.packetCount,
                        packetSize: pingSettings.packetSize,
                        maxLatencyMs: pingSettings.maxLatencyMs,
                        maxPacketLossPercent: pingSettings.maxPacketLossPercent
                    })} />
                </>
            )}
            
            {monitorType === 'port' && (
                <>
                    <input type="hidden" name="configuration" value={JSON.stringify({
                        host: portSettings.host,
                        port: portSettings.port,
                        sendString: portSettings.sendString,
                        expectedResponse: portSettings.expectedResponse,
                        expectStringMatchMode: portSettings.expectStringMatchMode
                    })} />
                </>
            )}
            
            {monitorType === 'dns' && (
                <>
                    <input type="hidden" name="configuration" value={JSON.stringify({
                        hostname: dnsSettings.hostname,
                        recordType: dnsSettings.recordType,
                        nameserver: dnsSettings.nameserver,
                        expectedIp: dnsSettings.expectedIp ? dnsSettings.expectedIp.split(',').map((ip: string) => ip.trim()) : [],
                        expectedValue: dnsSettings.expectedValue,
                        checkPropagation: dnsSettings.checkPropagation
                    })} />
                </>
            )}
        </form>
    );
}