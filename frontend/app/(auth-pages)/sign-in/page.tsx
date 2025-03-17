import { signInAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to Monitor SaaS</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access your account
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email" 
                type="email"
                placeholder="you@example.com" 
                required 
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            <SubmitButton 
              className="w-full"
              pendingText="Signing In..." 
              formAction={signInAction}
            >
              Sign in
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link 
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
