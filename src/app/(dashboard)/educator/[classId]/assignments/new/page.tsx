"use client"

import { useState, useEffect } from "react"
import { createAssignment, getConcepts } from "@/modules/identity/educatorActions"
import { BookOpen, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewAssignmentPage({ params }: { params: { classId: string } }) {
  // Since Next.js 15, dynamic route params must be awaited
  // We'll handle this generically with React.use() if needed, but for client components we can often destructure
  // Actually, to be safe, we'll wrap it in a useEffect or use React.use() if it's a promise
  
  const [classId, setClassId] = useState<string | null>(null)
  
  const [concepts, setConcepts] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [conceptId, setConceptId] = useState("")
  const [dueDate, setDueDate] = useState("")
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Handle the promise params
    async function resolveParams() {
      const p = await params
      setClassId(p.classId)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    async function fetchConcepts() {
      try {
        const fetched = await getConcepts()
        setConcepts(fetched)
        if (fetched.length > 0) {
          setConceptId(fetched[0].id)
        }
      } catch (err) {
        console.error("Failed to fetch concepts", err)
      }
    }
    fetchConcepts()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !conceptId || !classId) return

    setStatus("loading")
    setMessage("")

    try {
      const res = await createAssignment(classId, conceptId, title, dueDate)
      if (res.success) {
        setStatus("success")
        setMessage("Assignment created successfully!")
        setTimeout(() => {
          router.push(`/educator/${classId}`)
        }, 1500)
      }
    } catch (err: any) {
      setStatus("error")
      setMessage(err.message || "Failed to create assignment.")
    }
  }

  if (!classId) return null;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-8">
        <Link href={`/educator/${classId}`} className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-6">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Classroom
        </Link>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-primary" /> Create Assignment
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">
          Assign new curriculum concepts for your students to master.
        </p>
      </div>

      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Assignment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Review"
              className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Select Concept
            </label>
            <select
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            >
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.id} className="bg-[var(--panel-bg)] text-foreground">
                  {concept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              <BookOpen className="w-5 h-5" />
            )}
            {status === "loading" ? "Creating..." : status === "success" ? "Created!" : "Create Assignment"}
          </button>
        </form>
      </div>
    </div>
  )
}
