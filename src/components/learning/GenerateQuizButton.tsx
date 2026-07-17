"use client"
import { useState } from "react"
import { BrainCircuit } from "lucide-react"
import { generateQuizForConcept } from "@/modules/learning/aiActions"
import { useRouter } from "next/navigation"

export function GenerateQuizButton({ conceptId }: { conceptId: string }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateQuizForConcept(conceptId)
      // The server action revalidates the path, but we also refresh the router to be safe
      router.refresh()
    } catch (err) {
      console.error(err)
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-[var(--panel-bg)] border border-primary/20 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden mt-12">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit className="w-32 h-32 text-primary" />
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-4">No Quiz Found</h3>
        <p className="text-foreground/70 mb-8 max-w-md mx-auto">
          There are no practice questions for this lesson yet. Would you like our AI tutor to instantly generate a custom quiz based on the curriculum?
        </p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center shadow-lg shadow-primary/20"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              Generating Quiz...
            </>
          ) : (
            <>
              <BrainCircuit className="w-6 h-6 mr-3" />
              Generate AI Quiz
            </>
          )}
        </button>
      </div>
    </div>
  )
}
