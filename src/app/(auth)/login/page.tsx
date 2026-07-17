"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, User, Lock, ArrowRight } from "lucide-react"

import { signIn } from "next-auth/react"
import { guestLoginAction } from "./actions"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/") // Redirect to dashboard
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to LearnOS</h1>
          <p className="text-sm text-foreground/60 mt-2">Log in to your adaptive learning journey.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Email Address</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <div className="h-px bg-[var(--panel-border)] flex-1"></div>
          <span className="px-4 text-xs text-foreground/40 uppercase tracking-widest font-semibold">Or</span>
          <div className="h-px bg-[var(--panel-border)] flex-1"></div>
        </div>
        
        <form action={guestLoginAction}>
          <button
            type="submit"
            className="w-full mt-6 bg-black/30 hover:bg-black/50 border border-[var(--panel-border)] text-foreground font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Continue as Guest
          </button>
        </form>

        <p className="text-center text-sm text-foreground/60 mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}
