"use client"
import { useState, Suspense } from "next"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-6">Invalid or missing reset token.</p>
        <Link href="/forgot-password">
          <button className="bg-secondary text-white px-6 py-2 rounded-xl">Request New Link</button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg("Passwords do not match")
      setStatus("error")
      return
    }
    
    setStatus("loading")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      })

      if (res.ok) {
        setStatus("success")
        setTimeout(() => {
          router.push("/login?reset=success")
        }, 3000)
      } else {
        const data = await res.json()
        setErrorMsg(data.error || "Failed to reset password")
        setStatus("error")
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="text-center mt-6">
        <p className="text-green-400 mb-6 font-medium">Password successfully reset!</p>
        <p className="text-foreground/70 text-sm mb-6">Redirecting to login...</p>
        <Link href="/login">
          <button className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-colors">
            Go to Login
          </button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="text-foreground/70 mb-8 text-sm">
        Please enter your new password below.
      </p>
      
      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
            required
            minLength={8}
          />
        </div>
        <button 
          type="submit" 
          disabled={status === "loading"}
          className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mt-4"
        >
          {status === "loading" ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-10 max-w-md w-full shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Create New Password</h1>
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
