import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MonitorDashboard from "@/components/monitors/monitor-dashboard";

export default async function MonitorPage({ 
    params: { accountSlug, monitorId } 
}: { 
    params: { accountSlug: string, monitorId: string } 
}) {
    const supabaseClient = createClient();
    const { data: teamAccount } = await supabaseClient.rpc('get_account_by_slug', {
        slug: accountSlug
    });

    const { data: monitor } = await supabaseClient.rpc('get_monitor', {
        p_monitor_id: monitorId
    });


    if (!monitor) {
        notFound();
    }

    return (
        <div>
            <MonitorDashboard 
                monitor={monitor} 
                accountSlug={accountSlug}
            />
        </div>
    );
}
