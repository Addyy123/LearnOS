"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { bulkImportUsers } from "@/modules/identity/adminActions"
import { useRouter } from "next/navigation"

export function BulkImportUI() {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string
        const res = await bulkImportUsers(csvText)
        setResult({ success: true, message: `Successfully imported ${res.count} users.` })
        router.refresh()
      } catch (err: any) {
        setResult({ success: false, message: err.message || "Failed to import users." })
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => {
      setResult({ success: false, message: "Failed to read file." })
      setIsUploading(false)
    }
    
    reader.readAsText(file)
  }

  return (
    <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
        <Upload className="w-5 h-5 text-blue-400" /> Bulk Provision Users
      </h2>
      <p className="text-sm text-foreground/50 mb-6">Upload a CSV file containing `email,role` to instantly create verified accounts.</p>

      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
        ) : (
          <><Upload className="w-5 h-5" /> Select CSV File</>
        )}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${result.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {result.success ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
          <p className="text-sm font-medium">{result.message}</p>
        </div>
      )}
    </div>
  )
}
