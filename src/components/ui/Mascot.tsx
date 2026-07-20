import { Bot, Sparkles, AlertCircle, HelpCircle, Crown } from "lucide-react"

export type MascotState = 'idle' | 'happy' | 'sad' | 'thinking'

export const Mascot = ({ state = 'idle', xp = 0, className = '' }: { state?: MascotState, xp?: number, className?: string }) => {
  const isEvolved = xp >= 100;

  return (
    <div className={`relative inline-flex items-center justify-center p-4 rounded-3xl transition-colors duration-500 border-2 ${className} ${
      state === 'happy' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
      state === 'sad' ? 'bg-error/10 text-error border-error/20' : 
      state === 'thinking' ? 'bg-primary/10 text-primary border-primary/20' : 
      'bg-[var(--panel-bg)] text-foreground/50 border-[var(--panel-border)]'
    } ${isEvolved && state === 'idle' ? 'shadow-[0_0_15px_rgba(255,209,59,0.3)] border-warning/30 text-warning/80' : ''}`}>
      {state === 'happy' && <Sparkles className="absolute -top-2 -right-2 w-6 h-6 animate-pulse text-warning z-10" />}
      {state === 'sad' && <AlertCircle className="absolute -top-2 -right-2 w-6 h-6 animate-pulse text-error z-10" />}
      {state === 'thinking' && <HelpCircle className="absolute -top-2 -right-2 w-6 h-6 animate-bounce text-primary z-10" />}
      
      {isEvolved && (
        <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-warning animate-bounce drop-shadow-md z-10" fill="currentColor" />
      )}
      
      <Bot className={`w-12 h-12 transition-transform duration-300 relative z-0 ${
        state === 'happy' ? 'scale-110 -rotate-12 animate-bounce' : 
        state === 'sad' ? 'scale-90 rotate-12 opacity-80' : 
        state === 'thinking' ? 'animate-pulse' : 
        'hover:scale-105'
      } ${isEvolved && state === 'idle' ? 'text-warning' : ''}`} />
    </div>
  )
}
