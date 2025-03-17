"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Globe, 
  Shield, 
  Clock, 
  Webhook,
  Save,
  Slack,
  AlertTriangle,
  User,
  Key
} from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your monitoring preferences and system settings
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input type="email" value="joshkirkpatrick12@gmail.com" disabled />
            <p className="text-sm text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input placeholder="Enter your display name" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Enable 2FA for additional security
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Slack className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Slack Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Send alerts to Slack channels
                  </p>
                </div>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerts via SMS
                  </p>
                </div>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Webhook Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send alerts to custom webhooks
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Quiet Hours</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input type="time" defaultValue="22:00" />
              </div>
              <div className="flex items-center">to</div>
              <div className="flex-1">
                <Input type="time" defaultValue="07:00" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Only critical alerts will be sent during quiet hours
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Default Alert Threshold</Label>
            <Select defaultValue="30s">
              <SelectTrigger>
                <SelectValue placeholder="Select threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15s">15 seconds</SelectItem>
                <SelectItem value="30s">30 seconds</SelectItem>
                <SelectItem value="1m">1 minute</SelectItem>
                <SelectItem value="5m">5 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Time before an unresponsive service triggers an alert
            </p>
          </div>

          <div className="space-y-2">
            <Label>Alert Retry Interval</Label>
            <Select defaultValue="1m">
              <SelectTrigger>
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30s">30 seconds</SelectItem>
                <SelectItem value="1m">1 minute</SelectItem>
                <SelectItem value="5m">5 minutes</SelectItem>
                <SelectItem value="15m">15 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often to retry failed checks before alerting
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-recovery Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when services recover automatically
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value="sk_live_123456789abcdefghijklmnopqrstuvwxyz"
                disabled
              />
              <Button variant="outline">
                Regenerate
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this key to access the Monitor SaaS API
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>API Access</Label>
              <p className="text-sm text-muted-foreground">
                Enable API access to your monitoring data
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Webhook Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require authentication for webhook endpoints
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
