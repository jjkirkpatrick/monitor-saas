import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./layout-client";

// Server component to handle authentication and data fetching
export default async function DashboardLayout({
    children, 
    params: { accountSlug }
}: {
    children: React.ReactNode, 
    params: { accountSlug: string }
}) {
    const supabaseClient = createClient();

    const { data: teamAccount } = await supabaseClient.rpc('get_account_by_slug', {
        slug: accountSlug
    });

    if (!teamAccount) {
        redirect('/dashboard');
    }
    
    // Get user data for the account button
    const { data: personalAccount } = await supabaseClient.rpc('get_personal_account');

    return (
        <DashboardLayoutClient 
            accountSlug={accountSlug}
            userName={personalAccount?.name || "User Account"}
            userEmail={personalAccount?.email || "user@example.com"}
        >
            {children}
        </DashboardLayoutClient>
    );
}

export async function generateMetadata({ params }: { params: { accountSlug: string } }) {
    const supabaseClient = createClient();
    
    const { data: teamAccount } = await supabaseClient.rpc('get_account_by_slug', {
        slug: params.accountSlug
    });

    if (!teamAccount) {
        redirect('/dashboard');
    }
    
    return {
        title: `${teamAccount.name} - Monitor SaaS`,
    };
}
