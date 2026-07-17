"use client"

import { useState } from "react"
import { submitPracticeResults } from "@/modules/learning/actions"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react"

type Question = {
  question: string
  options: string[]
  answerIndex: number
}

type Props = {
  conceptId: string
  conceptName: string
  quizData: Question[]
}

export function PracticeUI({ conceptId, conceptName, quizData }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQ = quizData[currentIndex]

  const handleSelect = (idx: number) => {
    if (isAnswered) return
    setSelectedOption(idx)
  }

  const handleCheck = () => {
    if (selectedOption === null) return
    setIsAnswered(true)
    if (selectedOption === currentQ.answerIndex) {
      setScore(score + 1)
    }
  }

  const handleNext = async () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    } else {
      // Finished
      setIsSubmitting(true)
      const finalScore = score // it was already incremented in handleCheck
      const percentage = Math.round((finalScore / quizData.length) * 100)
      
      try {
        await submitPracticeResults(conceptId, percentage)
        setIsFinished(true)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (isFinished) {
    const percentage = Math.round((score / quizData.length) * 100)
    return (
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-10 backdrop-blur-xl text-center max-w-lg mx-auto mt-12">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Quiz Complete!</h2>
        <p className="text-foreground/70 text-lg mb-8">
          You scored <strong className="text-primary">{percentage}%</strong> on {conceptName}.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold transition-all w-full"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 text-sm font-medium text-foreground/50">
        <span>Question {currentIndex + 1} of {quizData.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="w-full bg-black/20 h-2 rounded-full mb-12 overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-500 ease-out" 
          style={{ width: `${((currentIndex) / quizData.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 backdrop-blur-xl shadow-2xl mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-8 leading-relaxed">
          {currentQ.question}
        </h3>

        <div className="space-y-4">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx
            let stateClass = "border-[var(--panel-border)] bg-black/20 hover:border-primary/50 hover:bg-white/5 text-foreground/80"
            
            if (isAnswered) {
              if (idx === currentQ.answerIndex) {
                stateClass = "border-green-500 bg-green-500/10 text-green-400"
              } else if (isSelected) {
                stateClass = "border-red-500 bg-red-500/10 text-red-400"
              } else {
                stateClass = "border-[var(--panel-border)] bg-black/20 opacity-50"
              }
            } else if (isSelected) {
              stateClass = "border-primary bg-primary/10 text-primary"
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all font-medium flex items-center justify-between ${stateClass}`}
              >
                {opt}
                {isAnswered && idx === currentQ.answerIndex && <CheckCircle2 className="w-5 h-5" />}
                {isAnswered && isSelected && idx !== currentQ.answerIndex && <XCircle className="w-5 h-5" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={handleCheck}
            disabled={selectedOption === null}
            className="bg-secondary hover:bg-secondary-hover disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold flex items-center transition-all"
          >
            {isSubmitting ? "Saving..." : currentIndex < quizData.length - 1 ? "Next Question" : "Finish Quiz"}
            {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
          </button>
        )}
      </div>
    </div>
  )
}
