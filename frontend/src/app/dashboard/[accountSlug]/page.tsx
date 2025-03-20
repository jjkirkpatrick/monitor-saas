import { redirect } from "next/navigation";

export default function PersonalAccountPage({ params }: { params: { accountSlug: string } }) {
    const { accountSlug } = params;

    redirect(`/dashboard/${accountSlug}/monitors`);
    
}