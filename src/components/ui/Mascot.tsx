import { Bot, Sparkles, AlertCircle, HelpCircle } from "lucide-react"

export type MascotState = 'idle' | 'happy' | 'sad' | 'thinking'

export const Mascot = ({ state = 'idle', className = '' }: { state?: MascotState, className?: string }) => {
  return (
    <div className={`relative inline-flex items-center justify-center p-4 rounded-3xl transition-colors duration-500 border-2 ${className} ${
      state === 'happy' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
      state === 'sad' ? 'bg-error/10 text-error border-error/20' : 
      state === 'thinking' ? 'bg-primary/10 text-primary border-primary/20' : 
      'bg-[var(--panel-bg)] text-foreground/50 border-[var(--panel-border)]'
    }`}>
      {state === 'happy' && <Sparkles className="absolute -top-2 -right-2 w-6 h-6 animate-pulse text-warning" />}
      {state === 'sad' && <AlertCircle className="absolute -top-2 -right-2 w-6 h-6 animate-pulse text-error" />}
      {state === 'thinking' && <HelpCircle className="absolute -top-2 -right-2 w-6 h-6 animate-bounce text-primary" />}
      
      <Bot className={`w-12 h-12 transition-transform duration-300 ${
        state === 'happy' ? 'scale-110 -rotate-12 animate-bounce' : 
        state === 'sad' ? 'scale-90 rotate-12 opacity-80' : 
        state === 'thinking' ? 'animate-pulse' : 
        'hover:scale-105'
      }`} />
    </div>
  )
}
