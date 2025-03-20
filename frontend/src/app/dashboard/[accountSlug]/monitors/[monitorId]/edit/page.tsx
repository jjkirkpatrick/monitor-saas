import { createClient } from "@/lib/supabase/server";
import { updateMonitor } from "@/lib/actions/monitors";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import EnhancedMonitorForm from "@/components/monitors/enhanced-monitor-form";

export default async function EditMonitorPage({ 
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

    async function handleUpdateMonitor(formData: FormData) {
        "use server";
        
        // Add the monitor ID to the form data
        formData.append("monitorId", monitorId);
        
        const result = await updateMonitor(null, formData);
        
        if (result.message) {
            // Handle error
            return { message: result.message };
        }
        
        // Redirect back to the monitor dashboard
        redirect(`/dashboard/${accountSlug}/monitors/${monitorId}`);
    }

    return (
        <EnhancedMonitorForm 
            action={handleUpdateMonitor} 
            initialData={monitor}
        />
    );
}
