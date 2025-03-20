"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useFormState } from "react-dom";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ChevronDown, Globe, Info } from "lucide-react";

interface MonitorFormProps {
    action: (formData: FormData) => Promise<{ message?: string }>;
    initialData?: any;
}

export default function MonitorForm({ action, initialData }: MonitorFormProps) {
    const [state, formAction] = useFormState((prevState: any, formData: FormData) => action(formData), {});
    const [tags, setTags] = useState<string>(initialData?.tags?.join(',') || '');
    const params = useParams();
    const accountSlug = params.accountSlug as string;
    const [monitorType, setMonitorType] = useState("http");
    const [notificationMethods, setNotificationMethods] = useState({
        email: true,
        sms: false,
        voice: false,
        mobile: false
    });

    return (
        <form action={formAction}>
            {state.message && (
                <div className="bg-red-900/20 text-red-400 p-3 rounded-md mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {state.message}
                </div>
            )}

            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Add single monitor.</h1>
                    
                    <div className="flex justify-between">
                        <div className="flex space-x-4">
                            <Link href={initialData ? `/dashboard/${accountSlug}/monitors/${initialData.id}` : `/dashboard/${accountSlug}/monitors`}>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit">{initialData ? 'Update Monitor' : 'Create Monitor'}</Button>
                        </div>
                        
                        <div className="flex items-center">
                            {initialData && (
                                <Link href={`/dashboard/${accountSlug}/monitors/${initialData.id}`} className="text-green-500 hover:underline text-sm">
                                    Monitor dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-base font-medium">Monitor type</Label>
                        <Card className="border border-border">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-green-900/20 rounded flex items-center justify-center">
                                    <Globe className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">HTTP / website monitoring</h3>
                                    <p className="text-sm text-muted-foreground">Use HTTP(S) monitor to monitor your website, API endpoint, or anything running on HTTP</p>
                                </div>
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url" className="text-base font-medium">URL to monitor</Label>
                        <Input 
                            id="url" 
                            name="url" 
                            type="url" 
                            defaultValue={initialData?.url || ''} 
                            required 
                            placeholder="https://" 
                            className="bg-background border-border"
                        />
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base font-medium">How will we notify you?</Label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 border border-border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="emailNotify" 
                                            checked={notificationMethods.email}
                                            onCheckedChange={(checked) => 
                                                setNotificationMethods({...notificationMethods, email: checked as boolean})
                                            }
                                        />
                                        <Label htmlFor="emailNotify" className="font-medium">E-mail</Label>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        No delay, no repeat
                                    </div>
                                </div>
                                <Input 
                                    value="joshkirpatrick12@gmail.com" 
                                    readOnly 
                                    className="bg-background/50 border-border text-muted-foreground"
                                />
                            </div>
                            
                            <div className="space-y-2 border border-border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="smsNotify" 
                                            checked={notificationMethods.sms}
                                            onCheckedChange={(checked) => 
                                                setNotificationMethods({...notificationMethods, sms: checked as boolean})
                                            }
                                        />
                                        <Label htmlFor="smsNotify" className="font-medium">SMS message</Label>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        No delay, no repeat
                                    </div>
                                </div>
                                <div className="text-sm text-green-500 hover:underline cursor-pointer">
                                    Add phone number
                                </div>
                            </div>
                            
                            <div className="space-y-2 border border-border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="voiceNotify" 
                                            checked={notificationMethods.voice}
                                            onCheckedChange={(checked) => 
                                                setNotificationMethods({...notificationMethods, voice: checked as boolean})
                                            }
                                        />
                                        <Label htmlFor="voiceNotify" className="font-medium">Voice call</Label>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        No delay, no repeat
                                    </div>
                                </div>
                                <div className="text-sm text-green-500 hover:underline cursor-pointer">
                                    Add phone number
                                </div>
                            </div>
                            
                            <div className="space-y-2 border border-border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="mobileNotify" 
                                            checked={notificationMethods.mobile}
                                            onCheckedChange={(checked) => 
                                                setNotificationMethods({...notificationMethods, mobile: checked as boolean})
                                            }
                                        />
                                        <Label htmlFor="mobileNotify" className="font-medium">Mobile push</Label>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        No delay, no repeat
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-sm text-muted-foreground">Download app for</span>
                                    <span className="text-sm text-green-500 hover:underline cursor-pointer">iOS</span>
                                    <span className="text-sm text-muted-foreground">or</span>
                                    <span className="text-sm text-green-500 hover:underline cursor-pointer">Android</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>You can set up notifications for</span>
                            <Link href="#" className="text-green-500 hover:underline">Integrations & Team</Link>
                            <span>in the specific tab and edit it later.</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Monitor interval</Label>
                            <div className="text-sm text-muted-foreground">
                                We recommend to use at least 1-minute checks 
                                <span className="text-green-500 hover:underline cursor-pointer ml-1">available in paid plans</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-600 rounded-full" style={{width: '20%'}}></div>
                                <div className="absolute inset-0 flex items-center justify-between px-4 text-xs">
                                    <span>30s</span>
                                    <span>1m</span>
                                    <span>5m</span>
                                    <span>30m</span>
                                    <span>1h</span>
                                    <span>12h</span>
                                    <span>24h</span>
                                </div>
                                <Input 
                                    type="range" 
                                    min="30" 
                                    max="86400" 
                                    step="30" 
                                    defaultValue="300"
                                    className="h-2 appearance-none bg-transparent cursor-pointer"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Your monitor will be checked every <span className="font-medium">5 minutes</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-medium">SSL certificate and Domain checks</span>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Available only in</span>
                                <span className="text-yellow-500 font-medium">Solo, Team</span>
                                <span>and</span>
                                <span className="text-purple-500 font-medium">Enterprise</span>
                                <span className="text-green-500 hover:underline cursor-pointer">Upgrade now</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium">Advanced settings</span>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="tags" className="text-base font-medium">Add tags</Label>
                        <div className="text-sm text-muted-foreground mb-2">
                            Optional. We use this to group monitors, so you are able to easily manage them in bulk or organize on status pages.
                        </div>
                        <Input 
                            id="tags" 
                            name="tags" 
                            value={tags} 
                            onChange={(e) => setTags(e.target.value)} 
                            placeholder="Click to add tag..." 
                            className="bg-background border-border"
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
