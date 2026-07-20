"use client"

import { useState } from "react"
import { createGoal, completeGoal, generateDynamicQuests } from "@/modules/planning/actions"
import { Target, CheckCircle2, Circle, Plus, X, Wand2 } from "lucide-react"

type Goal = {
  id: string
  title: string
  status: string
}

export function GoalsCard({ goals }: { goals: Goal[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateQuests = async () => {
    setIsGenerating(true)
    try {
      await generateDynamicQuests()
    } catch (error) {
      console.error(error)
      alert("Failed to generate quests. Have you started learning concepts yet?")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsSubmitting(true)
    try {
      await createGoal(newTitle)
      setNewTitle("")
      setIsAdding(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async (goalId: string) => {
    try {
      await completeGoal(goalId)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-6 backdrop-blur-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-secondary" /> Active Goals
        </h3>
        {!isAdding && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateQuests}
              disabled={isGenerating}
              title="Auto-generate daily quests"
              className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/40 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              title="Add a manual goal"
              className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center hover:bg-secondary/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {goals.filter(g => g.status === "ACTIVE").length === 0 && !isAdding && (
          <div className="text-center text-foreground/50 text-sm mt-4">
            No active goals. Set a goal to stay focused!
          </div>
        )}

        {goals.filter(g => g.status === "ACTIVE").map(goal => (
          <div key={goal.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-[var(--panel-border)] group">
            <button 
              onClick={() => handleComplete(goal.id)}
              className="mt-0.5 text-foreground/40 hover:text-green-400 transition-colors"
            >
              <Circle className="w-5 h-5 group-hover:hidden" />
              <CheckCircle2 className="w-5 h-5 hidden group-hover:block" />
            </button>
            <span className="text-foreground/90 font-medium text-sm leading-relaxed">{goal.title}</span>
          </div>
        ))}

        {isAdding && (
          <form onSubmit={handleAdd} className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="E.g. Master Next.js by Friday"
                className="flex-1 bg-black/30 border border-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="p-2 text-foreground/50 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting || !newTitle.trim()}
              className="w-full mt-2 bg-secondary hover:bg-secondary-hover disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors"
            >
              Save Goal
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
