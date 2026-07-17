"use client"

import { useState } from "react"
import { Bot, Sparkles, Loader2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react"
import { runContentBuilderAgent } from "@/modules/learning/agentActions"
import { useRouter } from "next/navigation"

export default function ContentBuilderPage() {
  const [prompt, setPrompt] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isRunning) return

    setIsRunning(true)
    setResult(null)

    try {
      const res = await runContentBuilderAgent(prompt)
      if (res.success) {
        setResult({ success: true, message: res.text || "Agent completed successfully." })
        router.refresh()
      } else {
        setResult({ success: false, message: res.error || "Agent failed." })
      }
    } catch (err) {
      setResult({ success: false, message: "An unexpected error occurred." })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 flex items-center justify-center rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          Content Builder Agent
        </h1>
        <p className="text-foreground/60 mt-2">
          Harness autonomous AI to instantly generate full curriculum modules, lessons, and quizzes.
          Generated content is saved as a Draft for your review.
        </p>
      </div>

      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              What do you want the agent to build?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a complete module on the Solar System for 5th graders. It should cover the inner planets, gas giants, and the asteroid belt."
              className="w-full bg-black/30 border border-[var(--panel-border)] rounded-xl px-4 py-4 text-foreground focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[150px] resize-y"
              disabled={isRunning}
            />
          </div>

          <button
            type="submit"
            disabled={isRunning || !prompt.trim()}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Agent is thinking and executing tools...
              </>
            ) : (
              <>
                <Bot className="w-6 h-6" />
                Dispatch Agent
              </>
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-8 p-6 rounded-2xl border ${result.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <div className="flex items-start gap-3">
              {result.success ? <CheckCircle2 className="w-6 h-6 mt-0.5" /> : <AlertCircle className="w-6 h-6 mt-0.5" />}
              <div>
                <h3 className="font-bold mb-1">{result.success ? "Mission Accomplished" : "Mission Failed"}</h3>
                <p className="opacity-90">{result.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-cyan-400 flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5" />
          How it works
        </h3>
        <p className="text-sm text-cyan-400/80 leading-relaxed">
          Unlike a standard chatbot, this Agent has access to the LearnOS database. When you dispatch it, it will autonomously formulate a plan and sequentially execute system tools to <strong>Create a Concept</strong>, <strong>Write JSON Lesson Content</strong>, and <strong>Generate a Diagnostic Quiz</strong>. You can view its creations in the Curriculum tab.
        </p>
      </div>
    </div>
  )
}
