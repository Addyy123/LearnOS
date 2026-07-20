"use client"

import { useState, useEffect } from "react"
import { submitConsent, submitGoals, selectSubjectAndCompleteOnboarding } from "@/modules/identity/onboardingActions"
import { getConcepts } from "@/modules/curriculum/actions"
import { ArrowRight, CheckCircle2, BookOpen } from "lucide-react"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  
  // Step 1: Consent
  const [ageRegion, setAgeRegion] = useState("")
  const [consentGiven, setConsentGiven] = useState(false)
  
  // Step 2: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  
  // Step 3: Subject
  const [concepts, setConcepts] = useState<any[]>([])
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (step === 3) {
      getConcepts().then(setConcepts).catch(console.error)
    }
  }, [step])

  const handleConsentSubmit = async () => {
    if (!ageRegion || !consentGiven) return
    setLoading(true)
    try {
      await submitConsent(ageRegion, consentGiven)
      setStep(2)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleGoalsSubmit = async () => {
    if (selectedGoals.length === 0) return
    setLoading(true)
    try {
      await submitGoals(selectedGoals)
      setStep(3)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectSubmit = async () => {
    if (!selectedConcept) return
    setLoading(true)
    try {
      await selectSubjectAndCompleteOnboarding(selectedConcept)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-primary' : 'bg-primary/20'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">Welcome to LearnOS</h1>
            <p className="text-foreground/70 mb-8">Before we begin, we need to verify a few details for your privacy and safety.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Age & Region</label>
                <select 
                  value={ageRegion} 
                  onChange={e => setAgeRegion(e.target.value)}
                  className="w-full bg-black/20 border border-[var(--panel-border)] rounded-xl py-3 px-4 focus:border-primary"
                >
                  <option value="" disabled className="bg-[var(--panel-bg)] text-foreground">Select your bracket...</option>
                  <option value="13-17_US" className="bg-[var(--panel-bg)] text-foreground">13-17 (US)</option>
                  <option value="18+_US" className="bg-[var(--panel-bg)] text-foreground">18+ (US)</option>
                  <option value="13-17_EU" className="bg-[var(--panel-bg)] text-foreground">13-17 (EU/GDPR)</option>
                  <option value="18+_EU" className="bg-[var(--panel-bg)] text-foreground">18+ (EU/GDPR)</option>
                  <option value="OTHER" className="bg-[var(--panel-bg)] text-foreground">Other Global</option>
                </select>
              </div>

              <div className="flex items-start gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <input 
                  type="checkbox" 
                  id="consent" 
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="consent" className="text-sm text-foreground/80 leading-relaxed">
                  I consent to the collection and processing of my learning data to personalize my curriculum and AI Tutor responses. I understand that I can request data deletion at any time.
                </label>
              </div>

              <button 
                onClick={handleConsentSubmit}
                disabled={!ageRegion || !consentGiven || loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Continue"} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">What are your goals?</h1>
            <p className="text-foreground/70 mb-8">Select what you want to achieve. We'll tailor your learning plan accordingly.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                "Pass an upcoming exam", 
                "Improve fundamental skills", 
                "Learn something new", 
                "Catch up on schoolwork",
                "Advanced enrichment"
              ].map(goal => (
                <button
                  key={goal}
                  onClick={() => {
                    setSelectedGoals(prev => 
                      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
                    )
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedGoals.includes(goal) 
                    ? "border-primary bg-primary/10" 
                    : "border-[var(--panel-border)] bg-black/20 hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal}</span>
                    {selectedGoals.includes(goal) && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={handleGoalsSubmit}
              disabled={selectedGoals.length === 0 || loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">Choose your first subject</h1>
            <p className="text-foreground/70 mb-8">Select a topic to generate your initial learning plan and diagnostic.</p>
            
            <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
              {concepts.map(concept => (
                <button
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept.id)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                    selectedConcept === concept.id 
                    ? "border-secondary bg-secondary/10" 
                    : "border-[var(--panel-border)] bg-black/20 hover:border-secondary/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedConcept === concept.id ? "bg-secondary text-white" : "bg-primary/20 text-primary"}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{concept.name}</h3>
                    <p className="text-sm text-foreground/60">{concept.description}</p>
                  </div>
                </button>
              ))}
              
              {concepts.length === 0 && (
                <div className="text-center p-8 border border-dashed border-[var(--panel-border)] rounded-xl text-foreground/50">
                  Loading subjects...
                </div>
              )}
            </div>

            <button 
              onClick={handleSubjectSubmit}
              disabled={!selectedConcept || loading}
              className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Generating Plan..." : "Take Diagnostic"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
