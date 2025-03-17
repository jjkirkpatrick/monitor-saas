import { forgotPasswordAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { SmtpMessage } from "../smtp-message"

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
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
            <SubmitButton 
              className="w-full"
              formAction={forgotPasswordAction}
              pendingText="Sending reset link..."
            >
              Send reset link
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>
          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
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
