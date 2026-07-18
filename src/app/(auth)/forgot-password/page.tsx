"use client"
import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      if (res.ok) {
        setStatus("success")
      } else {
        const data = await res.json()
        setErrorMsg(data.error || "Failed to send reset link")
        setStatus("error")
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.")
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-10 max-w-md w-full shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
        
        {status === "success" ? (
          <div className="text-center mt-6">
            <p className="text-foreground/80 mb-6">
              If an account with that email exists, we've sent a password reset link.
            </p>
            <Link href="/login">
              <button className="w-full bg-secondary hover:bg-secondary-hover text-white py-3 rounded-xl font-bold transition-colors">
                Return to Login
              </button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-foreground/70 mb-8 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {status === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={status === "loading"}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
