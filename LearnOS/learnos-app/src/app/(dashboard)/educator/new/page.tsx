"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClassroom } from "@/modules/identity/educatorActions"
import { GraduationCap, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewClassroomPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    
    try {
      await createClassroom(name, description)
      router.push("/educator")
    } catch (err: any) {
      setError(err.message || "Failed to create classroom")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link href="/educator" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Portal
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <GraduationCap className="w-10 h-10 text-secondary" /> Create New Class
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">
          Set up a new classroom to invite your students and track their progress.
        </p>
      </div>

      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Class Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-secondary transition-colors"
              placeholder="e.g. 10th Grade Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-secondary transition-colors"
              placeholder="A brief description of this class..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !name}
              className="bg-secondary hover:bg-secondary-hover disabled:opacity-50 disabled:hover:bg-secondary text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-secondary/20"
            >
              {isSubmitting ? "Creating..." : "Create Classroom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
