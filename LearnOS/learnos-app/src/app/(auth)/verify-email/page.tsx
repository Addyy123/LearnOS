"use client"
import Link from "next/link"
import { MailCheck } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-10 max-w-md w-full shadow-2xl backdrop-blur-xl text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/20 rounded-full">
            <MailCheck className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">Check your email</h1>
        <p className="text-foreground/70 mb-8">
          We've sent a verification link to your email address. Please click the link to activate your account.
        </p>
        <Link href="/login">
          <button className="w-full bg-secondary hover:bg-secondary-hover text-white py-3 rounded-xl font-bold transition-colors">
            Return to Login
          </button>
        </Link>
      </div>
    </div>
  )
}
