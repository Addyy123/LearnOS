"use client"

import { useState } from "react"
import { updateUserProfile } from "@/modules/identity/profileActions"
import { Avatar, AVATAR_OPTIONS } from "@/components/ui/Avatar"
import { Check } from "lucide-react"

export default function ProfileForm({ 
  initialDisplayName, 
  initialAvatarId, 
  email 
}: { 
  initialDisplayName: string | null, 
  initialAvatarId: string | null,
  email: string 
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName || "")
  const [avatarId, setAvatarId] = useState<string | null>(initialAvatarId)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaved(false)
    try {
      await updateUserProfile({
        displayName: displayName.trim() || undefined,
        avatarId: avatarId || undefined
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to update profile", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Avatar Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground/50 mb-3">Choose Avatar</label>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {AVATAR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAvatarId(opt.id)}
              className={`relative rounded-full transition-transform hover:scale-110 focus:outline-none ${
                avatarId === opt.id ? "ring-4 ring-primary scale-110" : "ring-0"
              }`}
            >
              <Avatar avatarId={opt.id} size="lg" className="mx-auto" />
              {avatarId === opt.id && (
                <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-foreground/50 mb-1">Display Name</label>
        <input 
          type="text" 
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={email.split('@')[0]}
          className="w-full bg-black/5 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-foreground font-medium outline-none transition-all"
        />
      </div>

      <div className="flex justify-end pt-4 border-t-2 border-[var(--panel-border)]">
        <button 
          type="submit" 
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-xl font-bold text-white transition-colors flex items-center gap-2 ${
            saved ? "bg-secondary" : "bg-primary hover:bg-primary-hover"
          }`}
        >
          {saved ? (
            <><Check className="w-5 h-5" /> Saved!</>
          ) : (
            isSaving ? "Saving..." : "Save Profile"
          )}
        </button>
      </div>
    </form>
  )
}
