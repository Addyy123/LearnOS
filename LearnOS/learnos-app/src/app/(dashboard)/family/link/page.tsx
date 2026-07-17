"use client"

import { useState } from "react"
import { Users, Link as LinkIcon, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { linkLearner } from "@/modules/identity/familyActions"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LinkLearnerPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    setMessage("")

    try {
      const res = await linkLearner(email)
      if (res.success) {
        setStatus("success")
        setMessage("Learner successfully linked!")
        setTimeout(() => {
          router.push("/family")
        }, 1500)
      } else {
        setStatus("error")
        setMessage(res.error || "Failed to link learner.")
      }
    } catch (err: any) {
      setStatus("error")
      setMessage(err.message || "An unexpected error occurred.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-8">
        <Link href="/family" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-6">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Family Portal
        </Link>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <LinkIcon className="w-10 h-10 text-primary" /> Link Learner
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">
          Enter your learner's email address to connect their account to your Family Portal.
        </p>
      </div>

      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Learner's Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@student.learnos.ai"
              className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          {status === "error" && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <LinkIcon className="w-5 h-5" />
            )}
            {status === "loading" ? "Linking..." : status === "success" ? "Linked!" : "Link Account"}
          </button>
        </form>
      </div>
    </div>
  )
}
