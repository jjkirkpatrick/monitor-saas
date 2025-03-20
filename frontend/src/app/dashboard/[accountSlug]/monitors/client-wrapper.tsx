"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  Clock, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Tag,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import MonitorListItem from "@/components/monitors/monitor-list-item";
import { useRouter } from "next/navigation";
import { deleteMonitor } from "@/lib/actions/monitors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import PaginationControls from "./pagination-controls";

interface ClientWrapperProps {
  monitors: any[];
  accountSlug: string;
  monitorStatsData: any;
  pagination: {
    total_count: number;
    total_pages: number;
    page_number: number;
    page_size: number;
  };
  currentPage: number;
}

export default function ClientWrapper({ 
  monitors, 
  accountSlug, 
  monitorStatsData,
  pagination,
  currentPage
}: ClientWrapperProps) {

    console.log("pagination asdadsd", pagination);


  const router = useRouter();
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'down-first' | 'up-first' | 'name-asc' | 'name-desc'>('down-first');
  const [tagsFilter, setTagsFilter] = useState<string | null>(null);
  
  // Reset selected monitors when monitors list changes
  useEffect(() => {
    setSelectedMonitors([]);
  }, [monitors]);
  
  // Get all unique tags from monitors
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    monitors.forEach(monitor => {
      if (monitor.tags && Array.isArray(monitor.tags)) {
        monitor.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [monitors]);
  

  // Filter and sort monitors
  const filteredAndSortedMonitors = useMemo(() => {
    return monitors.sort((a, b) => {
      // Sort by selected sort order
      switch (sortOrder) {
        case 'down-first':
          // Down monitors first, then by name
          if (a.status === 'down' && b.status !== 'down') return -1;
          if (a.status !== 'down' && b.status === 'down') return 1;
          return a.name.localeCompare(b.name);
          
        case 'up-first':
          // Up monitors first, then by name
          if (a.status === 'up' && b.status !== 'up') return -1;
          if (a.status !== 'up' && b.status === 'up') return 1;
          return a.name.localeCompare(b.name);
          
        case 'name-asc':
          // Alphabetical by name (A-Z)
          return a.name.localeCompare(b.name);
          
        case 'name-desc':
          // Alphabetical by name (Z-A)
          return b.name.localeCompare(a.name);
          
        default:
          return 0;
      }
    });
  }, [monitors, sortOrder]);
  
  // Use the server-provided pagination data directly
  const { total_count, total_pages, page_size } = pagination;
  
  // Paginate the filtered and sorted monitors
  const startIndex = (currentPage - 1) * page_size;
  const endIndex = startIndex + page_size;
  const paginatedMonitors = filteredAndSortedMonitors.slice(startIndex, endIndex);
  
  const handleSelectAll = () => {
    if (selectedMonitors.length === paginatedMonitors.length) {
      // If all are selected, deselect all
      setSelectedMonitors([]);
    } else {
      // Otherwise, select all monitors on the current page
      setSelectedMonitors(paginatedMonitors.map(monitor => monitor.id));
    }
  };
  
  const handleSelectMonitor = (monitorId: string) => {
    setSelectedMonitors(prev => {
      if (prev.includes(monitorId)) {
        return prev.filter(id => id !== monitorId);
      } else {
        return [...prev, monitorId];
      }
    });
  };
  
  const handleBulkDelete = async () => {
    if (selectedMonitors.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedMonitors.length} selected monitor${selectedMonitors.length > 1 ? 's' : ''}?`)) {
      setIsDeleting(true);
      
      try {
        // Delete monitors one by one
        const results = await Promise.all(
          selectedMonitors.map(monitorId => deleteMonitor(monitorId))
        );
        
        // Check if all deletions were successful
        const allSuccessful = results.every(result => result.success);
        
        if (allSuccessful) {
          setSelectedMonitors([]);
          router.refresh();
        } else {
          // Find failed deletions
          const failedResults = results.filter(result => !result.success);
          alert(`Failed to delete some monitors: ${failedResults.map(r => r.message).join(', ')}`);
        }
      } catch (error) {
        console.error("Error deleting monitors:", error);
        alert("An error occurred while deleting the monitors");
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <div className="flex">
      <div className="flex-1 pr-6">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Monitors.</h1>
            <div className="flex gap-2">
              <Link href={`/dashboard/${accountSlug}/monitors/new`}>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  New monitor
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2">
              <Checkbox 
                id="selectAll" 
                checked={paginatedMonitors.length > 0 && selectedMonitors.length === paginatedMonitors.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">{selectedMonitors.length} / {paginatedMonitors.length}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1" disabled={selectedMonitors.length === 0 || isDeleting}>
                  <span>Bulk actions</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={handleBulkDelete}
                  disabled={selectedMonitors.length === 0 || isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{tagsFilter || 'All tags'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => setTagsFilter(null)}
                  className={tagsFilter === null ? "bg-accent" : ""}
                >
                  All tags
                </DropdownMenuItem>
                {allTags.map(tag => (
                  <DropdownMenuItem 
                    key={tag}
                    onClick={() => setTagsFilter(tag)}
                    className={tagsFilter === tag ? "bg-accent" : ""}
                  >
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or url" 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {sortOrder === 'down-first' ? 'Down first' : 
                     sortOrder === 'up-first' ? 'Up first' : 
                     sortOrder === 'name-asc' ? 'Name (A-Z)' : 
                     'Name (Z-A)'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortOrder('down-first')}>
                  Down first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('up-first')}>
                  Up first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('name-asc')}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('name-desc')}>
                  Name (Z-A)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter(null)}
                  className={statusFilter === null ? "bg-accent" : ""}
                >
                  All statuses
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter('up')}
                  className={statusFilter === 'up' ? "bg-accent" : ""}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Up
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter('down')}
                  className={statusFilter === 'down' ? "bg-accent" : ""}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Down
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter('warning')}
                  className={statusFilter === 'warning' ? "bg-accent" : ""}
                >
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  Warning
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter('degraded')}
                  className={statusFilter === 'degraded' ? "bg-accent" : ""}
                >
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  Degraded
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? "bg-accent" : ""}
                >
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Monitors List */}
          {monitors.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <p className="text-muted-foreground">
                {monitors.length === 0 
                  ? "No monitors found. Create your first monitor to get started." 
                  : "No monitors match your current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedMonitors.map((monitor: any) => (
                <MonitorListItem 
                  key={monitor.id}
                  monitor={monitor}
                  accountSlug={accountSlug}
                  uptime={5}
                  isSelected={selectedMonitors.includes(monitor.id)}
                  onSelectChange={() => handleSelectMonitor(monitor.id)}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          <div className="mt-6">
            <PaginationControls 
              totalPages={pagination.total_pages} 
              currentPage={currentPage}
              accountSlug={accountSlug}
            />
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className="w-72">
        <div className="space-y-6">
          {/* Current Status */}
          <div className="border rounded-md overflow-hidden bg-gradient-to-b from-background to-accent/5">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Current status</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {/* Status indicators */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Up</span>
                  </div>
                  <span className="font-semibold">{monitorStatsData.status_counts?.up || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Down</span>
                  </div>
                  <span className="font-semibold">{monitorStatsData.status_counts?.down || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm">Warning</span>
                  </div>
                  <span className="font-semibold">{monitorStatsData.status_counts?.warning || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-semibold">{monitorStatsData.status_counts?.pending || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Degraded</span>
                  </div>
                  <span className="font-semibold">{monitorStatsData.status_counts?.degraded || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm">Maintenance</span>
                  </div>
                  <span className="font-semibold">{monitorStatsData.in_maintenance || 0}</span>
                </div>
              </div>
              
              {/* Monitor usage */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Monitor usage</span>
                  <span className="text-sm font-medium">{monitorStatsData.total || 0} / {monitorStatsData.limits?.monitor_limit || 50}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ 
                      width: `${Math.min(((monitorStatsData.total || 0) / (monitorStatsData.limits?.monitor_limit || 50)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground text-right">
                  {monitorStatsData.limits?.monitors_available || 0} available
                </div>
              </div>
            </div>
          </div>
          
          {/* Last 24 Hours */}
          <div className="border rounded-md overflow-hidden bg-gradient-to-b from-background to-accent/5">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Last 24 hours</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall uptime</span>
                  <span className="font-semibold text-red-500">0%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Incidents</span>
                  <span className="font-semibold">1</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time without incidents</span>
                  <span className="font-semibold">0m</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Affected monitors</span>
                  <span className="font-semibold">1</span>
                </div>
              </div>
              
              {/* Uptime visualization */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Uptime trend</span>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded overflow-hidden flex">
                  {/* Simplified uptime visualization - in a real app, this would be generated from actual data */}
                  <div className="h-full bg-green-500" style={{ width: '60%' }}></div>
                  <div className="h-full bg-red-500" style={{ width: '10%' }}></div>
                  <div className="h-full bg-green-500" style={{ width: '20%' }}></div>
                  <div className="h-full bg-amber-500" style={{ width: '10%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
