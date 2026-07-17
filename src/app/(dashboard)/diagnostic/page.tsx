"use client"

import { useState, useEffect } from "react"
import { submitDiagnostic, getDiagnosticQuestions } from "@/modules/learning/diagnosticActions"
import { useRouter } from "next/navigation"
import { BrainCircuit, CheckCircle2, ChevronRight, Loader2 } from "lucide-react"

type Question = {
  id: string
  text: string
  options: string[]
  correctAnswerIndex: number
}

export default function DiagnosticPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  
  useEffect(() => {
    getDiagnosticQuestions().then(qs => {
      setQuestions(qs)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-secondary" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh] flex-col space-y-4">
        <h2 className="text-2xl font-bold">No questions available</h2>
        <p className="text-foreground/70">Please ask your admin to seed the curriculum.</p>
      </div>
    )
  }

  const currentQ = questions[currentQuestionIndex]

  const handleNext = async () => {
    if (selectedAnswer === null) return

    const isCorrect = selectedAnswer === currentQ.correctAnswerIndex
    const newAnswers = [...answers, isCorrect]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
    } else {
      // Finish diagnostic
      setIsSubmitting(true)
      setIsDone(true)
      
      const correctCount = newAnswers.filter(a => a).length
      // Calculate score as a percentage 0-100
      const score = Math.round((correctCount / questions.length) * 100)
      
      try {
        await submitDiagnostic(score)
        // Give the UI a moment to show the success state before redirecting
        setTimeout(() => {
          router.push("/plan")
        }, 2000)
      } catch (err) {
        console.error("Failed to submit diagnostic", err)
        setIsSubmitting(false)
      }
    }
  }

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto h-[70vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-secondary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Diagnostic Complete!</h2>
        <p className="text-foreground/70 text-lg max-w-md">
          We've calibrated your mastery profile based on your results. Personalizing your learning journey...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-secondary" /> Initial Diagnostic
        </h1>
        <span className="bg-black/30 text-foreground/70 px-4 py-2 rounded-full font-medium text-sm border border-[var(--panel-border)]">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl">
        <h2 className="text-2xl text-foreground font-medium mb-8 leading-relaxed">
          {currentQ.text}
        </h2>

        <div className="space-y-4">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(idx)}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                selectedAnswer === idx 
                  ? 'border-secondary bg-secondary/10' 
                  : 'border-[var(--panel-border)] bg-black/20 hover:border-secondary/50'
              }`}
            >
              <span className={`text-lg font-medium ${selectedAnswer === idx ? 'text-secondary' : 'text-foreground/80'}`}>
                {option}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedAnswer === null || isSubmitting}
          className="bg-secondary hover:bg-secondary-hover disabled:opacity-50 disabled:hover:bg-secondary text-white px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-colors shadow-lg shadow-secondary/20"
        >
          {isSubmitting ? "Saving..." : (
            <>
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next Question"} <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
