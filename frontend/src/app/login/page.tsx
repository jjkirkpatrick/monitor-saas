import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";

export default function Login({
  searchParams,
}: {
  searchParams: { message: string, returnUrl?: string };
}) {
  const signIn = async (_prevState: any, formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return redirect(`/login?message=Could not authenticate user&returnUrl=${searchParams.returnUrl}`);
    }

    return redirect(searchParams.returnUrl || "/dashboard");
  };

  const signUp = async (_prevState: any, formData: FormData) => {
    "use server";

    const origin = headers().get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?returnUrl=${searchParams.returnUrl}`,
      },
    });

    if (error) {
      return redirect(`/login?message=Could not authenticate user&returnUrl=${searchParams.returnUrl}`);
    }

    return redirect(`/login?message=Check email to continue sign in process&returnUrl=${searchParams.returnUrl}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Link
        href="/"
        className="absolute left-8 top-8 flex items-center gap-2 rounded-md px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </Link>

      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-sm">
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              name="email"
              placeholder="you@example.com"
              required
              type="email"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-4 pt-4">
            <SubmitButton
              formAction={signIn}
              pendingText="Signing In..."
              className="w-full"
            >
              Sign In
            </SubmitButton>
            <SubmitButton
              formAction={signUp}
              variant="outline"
              pendingText="Signing Up..."
              className="w-full"
            >
              Sign Up
            </SubmitButton>
          </div>

          {searchParams?.message && (
            <div className="mt-4 rounded-md bg-muted p-4 text-center text-sm">
              {searchParams.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
