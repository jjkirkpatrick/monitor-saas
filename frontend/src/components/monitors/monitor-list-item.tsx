"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, MoreHorizontal, Trash2, XCircle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { deleteMonitor } from "@/lib/actions/monitors";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MonitorListItemProps {
  monitor: any;
  accountSlug: string;
  uptime: number;
  isSelected?: boolean;
  onSelectChange?: () => void;
}

export default function MonitorListItem({ 
  monitor, 
  accountSlug, 
  uptime,
  isSelected = false,
  onSelectChange
}: MonitorListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the monitor "${monitor.name}"?`)) {
      setIsDeleting(true);
      try {
        const result = await deleteMonitor(monitor.id);
        if (result.success) {
          router.refresh();
        } else {
          alert(`Failed to delete monitor: ${result.message}`);
        }
      } catch (error) {
        console.error("Error deleting monitor:", error);
        alert("An error occurred while deleting the monitor");
      } finally {
        setIsDeleting(false);
      }
    }
  };
  // Handle all possible status types with appropriate colors
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      case 'degraded': return 'text-orange-500';
      case 'pending': return 'text-purple-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const statusColor = getStatusColor(monitor.status);
  const StatusIcon = monitor.status === 'up' ? CheckCircle2 : XCircle;
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-md hover:bg-accent/5 transition-colors">
      <div className="flex items-center gap-3">
        {/* Checkbox for selecting the monitor */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox 
            id={`monitor-${monitor.id}`} 
            checked={isSelected}
            onCheckedChange={onSelectChange}
          />
        </div>
        
        {/* Main content wrapped in Link */}
        <Link 
          href={`/dashboard/${accountSlug}/monitors/${monitor.id}`}
          className="flex items-center gap-3 flex-1"
        >
          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
          <div>
            <h3 className="font-medium">{monitor.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{monitor.type_name || monitor.type || 'HTTP'}</span>
              <span>
                {monitor.status === 'up' ? 'Up' : 
                 monitor.status === 'down' ? 'Down' :
                 monitor.status === 'pending' ? 'Pending' :
                 monitor.status === 'warning' ? 'Warning' :
                 monitor.status === 'degraded' ? 'Degraded' :
                 monitor.status === 'error' ? 'Error' :
                 monitor.status || 'Unknown'}
                {monitor.last_check_at ? 
                  ` ${formatDistanceToNow(new Date(monitor.last_check_at))}` : 
                  ' 5 min'}
              </span>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                monitor.status === 'up' ? 'bg-green-500' : 
                monitor.status === 'down' ? 'bg-red-500' : 
                monitor.status === 'warning' ? 'bg-amber-500' : 
                monitor.status === 'degraded' ? 'bg-orange-500' : 
                monitor.status === 'pending' ? 'bg-purple-500' : 
                monitor.status === 'error' ? 'bg-red-500' : 
                'bg-gray-500'
              }`}
              style={{ width: `${uptime}%` }}
            ></div>
          </div>
          <span className="text-xs text-muted-foreground">{uptime}%</span>
        </div>
        
        {/* Menu button with dropdown */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
