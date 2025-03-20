import { createClient } from "@/lib/supabase/server";
import ClientWrapper from "./client-wrapper";

export default async function MonitorsPage({ 
    params: { accountSlug },
    searchParams
}: { 
    params: { accountSlug: string },
    searchParams: { page?: string, pageSize?: string }
}) {
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const pageSize = searchParams.pageSize ? parseInt(searchParams.pageSize) : 10;
    const supabaseClient = createClient();
    const { data: teamAccount } = await supabaseClient.rpc('get_account_by_slug', {
        slug: accountSlug
    });

    const { data, error } = await supabaseClient.rpc('get_monitors_list', {
        p_account_id: teamAccount?.account_id,
        p_page_number: page,
        p_page_size: pageSize,
    });

    const monitors = data?.monitors || [];
    

    const { data: monitorStats, error: monitorStatsError } = await supabaseClient.rpc('get_monitor_stats', {
        p_account_id: teamAccount?.account_id.toString()
    });

    // Use the new monitor stats format
    const monitorStatsData = monitorStats || {
        total: 0,
        active: 0,
        limits: { monitor_limit: 50, monitors_available: 50 },
        by_type: {},
        status_counts: { up: 0, down: 0, error: 0, pending: 0, warning: 0, degraded: 0 },
        in_maintenance: 0
    };

    console.log("data?.pagination", data?.pagination);


    return (
        <ClientWrapper 
            monitors={monitors}
            accountSlug={accountSlug}
            monitorStatsData={monitorStatsData}
            pagination={data?.pagination}
            currentPage={page}
        />
    );
}
