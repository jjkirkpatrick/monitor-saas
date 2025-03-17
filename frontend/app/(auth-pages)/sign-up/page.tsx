import { signUpAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { SmtpMessage } from "../smtp-message"

export default async function Signup(props: {
  searchParams: Promise<Message>
}) {
  const searchParams = await props.searchParams
  if ("message" in searchParams) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="p-6">
            <FormMessage message={searchParams} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email and create a password to get started
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                minLength={6}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
            <SubmitButton 
              className="w-full"
              formAction={signUpAction} 
              pendingText="Creating account..."
            >
              Create account
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link 
              href="/sign-in"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <SmtpMessage />
        </CardContent>
      </Card>
    </div>
  )
}
