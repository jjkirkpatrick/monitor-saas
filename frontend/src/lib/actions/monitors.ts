"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

// -----------------------
// Monitor Types
// -----------------------

export async function getMonitorTypes() {
  "use server";
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitor_types');
  
  if (error) {
    console.error("Error fetching monitor types:", error);
    return [];
  }
  
  return data || [];
}

// -----------------------
// Monitor CRUD Operations
// -----------------------

export async function getMonitor(monitorId: string) {
  "use server";
  
  if (!monitorId) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitor', {
    p_monitor_id: monitorId
  });
  
  if (error) {
    console.error("Error fetching monitor:", error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function getMonitors(
  accountId: string, 
  page: number = 1, 
  pageSize: number = 25, 
  status?: string, 
  monitorTypeId?: string, 
  tag?: string, 
  search?: string
) {
  "use server";
  
  if (!accountId) return { monitors: [], pagination: { total_count: 0, total_pages: 0, page_number: 1, page_size: pageSize } };
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitors', {
    p_account_id: accountId,
    p_page_number: page,
    p_page_size: pageSize,
    p_status: status || null,
    p_monitor_type_id: monitorTypeId || null,
    p_tag: tag || null,
    p_search: search || null
  });
  
  if (error) {
    console.error("Error fetching monitors:", error);
    throw new Error(error.message);
  }
  
  return data || { monitors: [], pagination: { total_count: 0, total_pages: 0, page_number: page, page_size: pageSize } };
}

export async function createMonitor(prevState: any, formData: FormData) {
  "use server";

  const accountSlug = formData.get("accountId") as string;
  const { data: accountData, error: accountError } = await createClient().rpc('get_account_by_slug', {
    slug: accountSlug
  });
  const accountId = accountData?.account_id;

  const name = formData.get("name") as string;
  const monitorTypeId = formData.get("monitorType") as string || 'http';
  const description = formData.get("description") as string;
  const intervalSeconds = parseInt(formData.get("intervalSeconds") as string) || 300;
  const timeoutSeconds = parseInt(formData.get("timeoutSeconds") as string) || 30;
  const alertAfterFailures = parseInt(formData.get("alertAfterFailures") as string) || 1;
  const alertRecoveryThreshold = parseInt(formData.get("alertRecoveryThreshold") as string) || 1;
  const tags = formData.get("tags") ? (formData.get("tags") as string).split(",").map(tag => tag.trim()) : [];
  const severity = formData.get("severity") as string || 'medium';
  const maintenanceMode = formData.get("maintenanceMode") === "true";
  
  // Build configuration object based on monitor type
  let configuration: any = {};
  
  switch (monitorTypeId) {
    case 'http':
      configuration = {
        url: formData.get("url") as string,
        method: formData.get("method") as string || 'GET',
        headers: formData.get("headers") ? JSON.parse(formData.get("headers") as string) : {},
        body: formData.get("body") as string,
        expectedStatusCode: parseInt(formData.get("expectedStatusCode") as string) || 200,
        verifySSL: formData.get("verifySSL") === "true",
        followRedirects: formData.get("followRedirects") === "true",
        maxRedirects: parseInt(formData.get("maxRedirects") as string) || 5,
        contentMatch: formData.get("contentMatch") as string,
        contentMatchMode: formData.get("contentMatchMode") as string || 'contains',
        basicAuthUser: formData.get("basicAuthUser") as string,
        basicAuthPassword: formData.get("basicAuthPassword") as string
      };
      break;
      
    case 'ping':
      configuration = {
        host: formData.get("host") as string,
        packetCount: parseInt(formData.get("packetCount") as string) || 4,
        packetSize: parseInt(formData.get("packetSize") as string) || 56,
        maxLatencyMs: parseInt(formData.get("maxLatencyMs") as string) || 500,
        maxPacketLossPercent: parseInt(formData.get("maxPacketLossPercent") as string) || 10
      };
      break;
      
    case 'port':
      configuration = {
        host: formData.get("host") as string,
        port: parseInt(formData.get("port") as string),
        sendString: formData.get("sendString") as string,
        expectedResponse: formData.get("expectedResponse") as string,
        expectStringMatchMode: formData.get("expectStringMatchMode") as string || 'contains'
      };
      break;
      
    case 'dns':
      configuration = {
        hostname: formData.get("hostname") as string,
        recordType: formData.get("recordType") as string,
        nameserver: formData.get("nameserver") as string,
        expectedIp: formData.get("expectedIp") ? (formData.get("expectedIp") as string).split(",").map(ip => ip.trim()) : null,
        expectedValue: formData.get("expectedValue") as string,
        checkPropagation: formData.get("checkPropagation") === "true"
      };
      break;
      
    // Add other monitor types as needed
  }
  
  // Settings object for all monitor types
  const settings = {
    notification_delay: parseInt(formData.get("notificationDelay") as string) || 0,
    retry_count: parseInt(formData.get("retryCount") as string) || 0,
    retry_interval: parseInt(formData.get("retryInterval") as string) || 30
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('create_monitor', {
      p_account_id: accountId,
      p_name: name,
      p_monitor_type_id: monitorTypeId,
      p_description: description,
      p_interval_seconds: intervalSeconds,
      p_timeout_seconds: timeoutSeconds,
      p_alert_after_failures: alertAfterFailures,
      p_alert_recovery_threshold: alertRecoveryThreshold,
      p_tags: tags,
      p_severity: severity,
      p_maintenance_mode: maintenanceMode,
      p_configuration: configuration,
      p_settings: settings
    });

    if (error) {
      console.error("Error creating monitor:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error("Exception creating monitor:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

export async function updateMonitor(prevState: any, formData: FormData) {
  "use server";

  const monitorId = formData.get("monitorId") as string;
  if (!monitorId) {
    return {
      success: false,
      message: "Monitor ID is required"
    };
  }
  
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const intervalSeconds = formData.get("intervalSeconds") ? parseInt(formData.get("intervalSeconds") as string) : null;
  const timeoutSeconds = formData.get("timeoutSeconds") ? parseInt(formData.get("timeoutSeconds") as string) : null;
  const alertAfterFailures = formData.get("alertAfterFailures") ? parseInt(formData.get("alertAfterFailures") as string) : null;
  const alertRecoveryThreshold = formData.get("alertRecoveryThreshold") ? parseInt(formData.get("alertRecoveryThreshold") as string) : null;
  const tags = formData.get("tags") ? (formData.get("tags") as string).split(",").map(tag => tag.trim()) : null;
  const severity = formData.get("severity") as string || null;
  
  // Build configuration object based on monitor type
  let configuration: any = null;
  const monitorTypeId = formData.get("monitorType") as string;
  
  if (monitorTypeId) {
    switch (monitorTypeId) {
      case 'http':
        configuration = {};
        if (formData.get("url")) configuration.url = formData.get("url") as string;
        if (formData.get("method")) configuration.method = formData.get("method") as string;
        if (formData.get("headers")) configuration.headers = JSON.parse(formData.get("headers") as string);
        if (formData.get("body")) configuration.body = formData.get("body") as string;
        if (formData.get("expectedStatusCode")) configuration.expectedStatusCode = parseInt(formData.get("expectedStatusCode") as string);
        if (formData.has("verifySSL")) configuration.verifySSL = formData.get("verifySSL") === "true";
        if (formData.has("followRedirects")) configuration.followRedirects = formData.get("followRedirects") === "true";
        if (formData.get("maxRedirects")) configuration.maxRedirects = parseInt(formData.get("maxRedirects") as string);
        if (formData.get("contentMatch")) configuration.contentMatch = formData.get("contentMatch") as string;
        if (formData.get("contentMatchMode")) configuration.contentMatchMode = formData.get("contentMatchMode") as string;
        if (formData.get("basicAuthUser")) configuration.basicAuthUser = formData.get("basicAuthUser") as string;
        if (formData.get("basicAuthPassword")) configuration.basicAuthPassword = formData.get("basicAuthPassword") as string;
        break;
        
      // Add other monitor types similarly
    }
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('update_monitor', {
      p_monitor_id: monitorId,
      p_name: name,
      p_description: description,
      p_interval_seconds: intervalSeconds,
      p_timeout_seconds: timeoutSeconds,
      p_alert_after_failures: alertAfterFailures,
      p_alert_recovery_threshold: alertRecoveryThreshold,
      p_tags: tags,
      p_severity: severity,
      p_configuration: configuration,
      p_settings: null  // Not updating settings for now
    });

    if (error) {
      console.error("Error updating monitor:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    revalidatePath(`/monitors/${monitorId}`);
    
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error("Exception updating monitor:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

export async function deleteMonitor(monitorId: string) {
  "use server";
  
  if (!monitorId) {
    return {
      success: false,
      message: "Monitor ID is required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('delete_monitor', {
      p_monitor_id: monitorId
    });

    if (error) {
      console.error("Error deleting monitor:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    return {
      success: true
    };
  } catch (err) {
    console.error("Exception deleting monitor:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

// -----------------------
// Monitor State Management
// -----------------------

export async function toggleMonitorMaintenance(monitorId: string, maintenanceMode: boolean, maintenanceUntil?: Date) {
  "use server";
  
  if (!monitorId) {
    return {
      success: false,
      message: "Monitor ID is required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('toggle_monitor_maintenance', {
      p_monitor_id: monitorId,
      p_maintenance_mode: maintenanceMode,
      p_maintenance_until: maintenanceUntil || null
    });

    if (error) {
      console.error("Error toggling maintenance mode:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    revalidatePath(`/monitors/${monitorId}`);
    
    return {
      success: true
    };
  } catch (err) {
    console.error("Exception toggling maintenance mode:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

export async function toggleMonitorActive(monitorId: string, active: boolean) {
  "use server";
  
  if (!monitorId) {
    return {
      success: false,
      message: "Monitor ID is required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('toggle_monitor_active', {
      p_monitor_id: monitorId,
      p_active: active
    });

    if (error) {
      console.error("Error toggling active state:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    revalidatePath(`/monitors/${monitorId}`);
    
    return {
      success: true
    };
  } catch (err) {
    console.error("Exception toggling active state:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

// -----------------------
// Monitor Groups
// -----------------------

export async function getMonitorGroups(accountId: string) {
  "use server";
  
  if (!accountId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase.from('monitor_groups')
    .select('*')
    .eq('account_id', accountId)
    .order('name');
  
  if (error) {
    console.error("Error fetching monitor groups:", error);
    return [];
  }
  
  return data || [];
}

export async function createMonitorGroup(accountId: string, name: string, description?: string, icon?: string, color?: string) {
  "use server";
  
  if (!accountId || !name) {
    return {
      success: false,
      message: "Account ID and name are required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('create_monitor_group', {
      p_account_id: accountId,
      p_name: name,
      p_description: description || null,
      p_icon: icon || null,
      p_color: color || '#4f46e5'
    });

    if (error) {
      console.error("Error creating monitor group:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    return {
      success: true,
      groupId: data
    };
  } catch (err) {
    console.error("Exception creating monitor group:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

export async function updateMonitorGroup(groupId: string, name?: string, description?: string, icon?: string, color?: string) {
  "use server";
  
  if (!groupId) {
    return {
      success: false,
      message: "Group ID is required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('update_monitor_group', {
      p_group_id: groupId,
      p_name: name || null,
      p_description: description || null,
      p_icon: icon || null,
      p_color: color || null
    });

    if (error) {
      console.error("Error updating monitor group:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    return {
      success: true
    };
  } catch (err) {
    console.error("Exception updating monitor group:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

export async function deleteMonitorGroup(groupId: string) {
  "use server";
  
  if (!groupId) {
    return {
      success: false,
      message: "Group ID is required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('delete_monitor_group', {
      p_group_id: groupId
    });

    if (error) {
      console.error("Error deleting monitor group:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    return {
      success: true
    };
  } catch (err) {
    console.error("Exception deleting monitor group:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

export async function setMonitorGroup(monitorId: string, groupId: string | null) {
  "use server";
  
  if (!monitorId) {
    return {
      success: false,
      message: "Monitor ID is required"
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('set_monitor_group', {
      p_monitor_id: monitorId,
      p_group_id: groupId
    });

    if (error) {
      console.error("Error setting monitor group:", error);
      return {
        success: false,
        message: error.message
      };
    }

    revalidatePath('/monitors');
    revalidatePath(`/monitors/${monitorId}`);
    
    return {
      success: true
    };
  } catch (err) {
    console.error("Exception setting monitor group:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unknown error occurred"
    };
  }
}

// -----------------------
// Monitor Stats and Metrics
// -----------------------

export async function getMonitorStats(accountId: string) {
  "use server";
  
  if (!accountId) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitor_stats', {
    p_account_id: accountId
  });
  
  if (error) {
    console.error("Error fetching monitor stats:", error);
    return null;
  }
  
  return data;
}

export async function getMonitorMetrics(monitorId: string, startTime: Date, endTime?: Date, page: number = 1, pageSize: number = 100) {
  "use server";
  
  if (!monitorId || !startTime) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitor_metrics', {
    p_monitor_id: monitorId,
    p_start_time: startTime.toISOString(),
    p_end_time: endTime ? endTime.toISOString() : new Date().toISOString(),
    p_page_number: page,
    p_page_size: pageSize
  });
  
  if (error) {
    console.error("Error fetching monitor metrics:", error);
    return null;
  }
  
  return data;
}

export async function getMonitorUptime(monitorId: string, startTime: Date, endTime?: Date) {
  "use server";
  
  if (!monitorId || !startTime) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitor_uptime', {
    p_monitor_id: monitorId,
    p_start_time: startTime.toISOString(),
    p_end_time: endTime ? endTime.toISOString() : new Date().toISOString()
  });
  
  if (error) {
    console.error("Error fetching monitor uptime:", error);
    return null;
  }
  
  return data;
}

export async function getMonitorResponseStats(monitorId: string, startTime: Date, endTime?: Date) {
  "use server";
  
  if (!monitorId || !startTime) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_monitor_response_stats', {
    p_monitor_id: monitorId,
    p_start_time: startTime.toISOString(),
    p_end_time: endTime ? endTime.toISOString() : new Date().toISOString()
  });
  
  if (error) {
    console.error("Error fetching monitor response stats:", error);
    return null;
  }
  
  return data;
}