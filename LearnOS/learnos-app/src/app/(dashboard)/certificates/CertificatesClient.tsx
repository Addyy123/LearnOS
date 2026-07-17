"use client"

import { useState } from "react"
import { Award } from "lucide-react"
import { CertificateView } from "@/components/learning/CertificateView"

interface Certificate {
  id: string
  conceptName: string
  learnerName: string
  dateEarned: string
  score: number
}

export default function CertificatesClient({ certificates }: { certificates: Certificate[] }) {
  const [activeCert, setActiveCert] = useState<Certificate | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.length === 0 ? (
          <div className="col-span-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-12 text-center backdrop-blur-xl">
            <Award className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Certificates Yet</h3>
            <p className="text-foreground/50 max-w-sm mx-auto mb-6">
              Complete practice modules and reach 80% mastery in a concept to earn your first certificate!
            </p>
          </div>
        ) : (
          certificates.map(cert => (
            <div key={cert.id} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl group hover:border-yellow-500/50 transition-all">
              <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-yellow-500 transition-colors line-clamp-1">
                {cert.conceptName}
              </h3>
              
              <div className="text-sm text-foreground/60 mb-6 flex justify-between">
                <span>Score: {cert.score}%</span>
                <span>{new Date(cert.dateEarned).toLocaleDateString()}</span>
              </div>

              <button 
                onClick={() => setActiveCert(cert)}
                className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-6 py-2 rounded-xl font-bold transition-colors"
              >
                View Certificate
              </button>
            </div>
          ))
        )}
      </div>

      {activeCert && (
        <CertificateView 
          certificate={activeCert} 
          onClose={() => setActiveCert(null)} 
        />
      )}
    </>
  )
}
