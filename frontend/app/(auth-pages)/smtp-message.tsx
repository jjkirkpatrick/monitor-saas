import { ArrowUpRight, InfoIcon } from "lucide-react"
import Link from "next/link"

export function SmtpMessage() {
  return (
    <div className="flex gap-4 items-start">
      <InfoIcon size={16} className="mt-1 text-muted-foreground" />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Emails are rate limited. Enable Custom SMTP to increase the rate limit.
        </p>
        <Link
          href="https://supabase.com/docs/guides/auth/auth-smtp"
          target="_blank"
          className="text-sm text-primary hover:underline flex items-center gap-1 w-fit"
        >
          Learn more <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}
