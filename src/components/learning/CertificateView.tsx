"use client"

import { X } from "lucide-react"

interface CertificateViewProps {
  certificate: {
    id: string
    conceptName: string
    learnerName: string
    dateEarned: string
    score: number
  }
  onClose: () => void
}

export function CertificateView({ certificate, onClose }: CertificateViewProps) {
  const formattedDate = new Date(certificate.dateEarned).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden text-slate-900 border-[16px] border-slate-900">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Content - Print styling via standard CSS */}
        <div 
          className="p-12 md:p-20 text-center border-4 border-double border-slate-300 m-4 bg-[#faf9f6]"
          style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 tracking-wider">
              Certificate of Completion
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 uppercase tracking-[0.3em] mt-4">
              LearnOS Academy
            </p>

            <div className="py-8">
              <p className="text-slate-500 italic mb-4">This is to certify that</p>
              <h2 className="text-3xl md:text-5xl font-serif text-slate-800 border-b-2 border-slate-300 inline-block px-12 pb-2">
                {certificate.learnerName}
              </h2>
            </div>

            <div className="py-4">
              <p className="text-slate-500 italic mb-2">has successfully completed the course module</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                {certificate.conceptName}
              </h3>
              <p className="text-slate-500 mt-2">
                with a recorded mastery score of <span className="font-bold text-slate-800">{certificate.score}%</span>
              </p>
            </div>

            <div className="pt-16 flex justify-between items-end max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-xl font-serif text-slate-800 border-b border-slate-400 pb-1 px-8">
                  {formattedDate}
                </div>
                <p className="text-sm text-slate-500 uppercase mt-2">Date Awarded</p>
              </div>

              <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-yellow-600 shadow-lg rotate-12">
                <div className="text-white font-bold text-center leading-tight shadow-sm">
                  OFFICIAL<br/>SEAL
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-serif text-slate-800 border-b border-slate-400 pb-1 px-8" style={{ fontFamily: "cursive" }}>
                  AI Tutor
                </div>
                <p className="text-sm text-slate-500 uppercase mt-2">LearnOS Instructor</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
