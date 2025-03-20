import { createClient } from "@/lib/supabase/server";
import { createMonitor } from "@/lib/actions/monitors";
import { redirect } from "next/navigation";
import EnhancedMonitorForm from "@/components/monitors/enhanced-monitor-form";

export default async function NewMonitorPage({ params: { accountSlug } }: { params: { accountSlug: string } }) {
    const supabaseClient = createClient();
    const { data: teamAccount } = await supabaseClient.rpc('get_account_by_slug', {
        slug: accountSlug
    });

    async function handleCreateMonitor(formData: FormData) {
        "use server";
        
        // Add the account ID to the form data
        formData.append("accountId", teamAccount.account_id);
        
        const result = await createMonitor(null, formData);
        

        if (result.message) {
            // Handle error
            return { message: result.message };
        }
        
        // Redirect to the monitor detail page
        redirect(`/dashboard/${accountSlug}/monitors/${result.data}`);
    }

    return (
        <EnhancedMonitorForm action={handleCreateMonitor} />
    );
}
