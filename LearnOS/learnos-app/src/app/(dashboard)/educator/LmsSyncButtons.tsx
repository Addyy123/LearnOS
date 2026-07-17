"use client"

import { useState, useRef } from "react"
import { DownloadCloud, Loader2, Link as LinkIcon, Upload } from "lucide-react"
import { syncFromLms, importCsvRoster } from "@/modules/identity/educatorActions"
import { useRouter } from "next/navigation"

export default function LmsSyncButtons() {
  const [isSyncing, setIsSyncing] = useState<"canvas" | "google" | "csv" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSync = async (platform: "canvas" | "google") => {
    setIsSyncing(platform)
    try {
      await syncFromLms(platform)
      router.refresh()
    } catch (error) {
      console.error(`Failed to sync from ${platform}:`, error)
      alert("Failed to sync LMS. Check console.")
    } finally {
      setIsSyncing(null)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSyncing("csv")
    const reader = new FileReader()
    reader.onload = async (event) => {
      const csvText = event.target?.result as string
      try {
        const res = await importCsvRoster(csvText, file.name.replace('.csv', ''))
        alert(`Successfully imported ${res.importedCount} students!`)
        router.refresh()
      } catch (err: any) {
        alert(err.message || "Failed to import CSV")
      } finally {
        setIsSyncing(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleSync("canvas")}
        disabled={isSyncing !== null}
        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSyncing === "canvas" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
        Canvas
      </button>

      <button 
        onClick={() => handleSync("google")}
        disabled={isSyncing !== null}
        className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSyncing === "google" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <DownloadCloud className="w-5 h-5" />
        )}
        Google Classroom
      </button>
      
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleCsvUpload} 
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isSyncing !== null}
        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSyncing === "csv" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
        Import CSV Roster
      </button>
    </div>
  )
}
