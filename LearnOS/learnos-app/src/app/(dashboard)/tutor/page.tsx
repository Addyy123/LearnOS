"use client"

import { useRef, useEffect, useState } from "react"
import { Send, User, Bot, Mic, MicOff, Volume2, VolumeX, Square, ImagePlus, X, Lightbulb } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  imageUrl?: string
}

export default function TutorPage() {
  const suggestedPrompts = [
    "Explain this like I'm 5",
    "Give me a hint",
    "Can you give an example?",
    "Check my answer"
  ];

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [isListening, setIsListening] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const [isAutoSpeak, setIsAutoSpeak] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    
    // Remove markdown or symbols that sound weird
    const cleanText = text.replace(/[*_#`]/g, '')
    
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!isLoading) {
      // Small timeout ensures the DOM has updated and the input is no longer disabled
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isLoading])

  useEffect(() => {
    // Fetch initial chat history
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/chat/history")
        if (res.ok) {
          const data = await res.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages)
          }
          if (data.conversationId) {
            setConversationId(data.conversationId)
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    // MediaRecorder doesn't need initialization on mount, just on button click
    return () => {
      // Cleanup streams if unmounting while recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      setIsListening(false)
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert("Voice input requires a secure connection (HTTPS or localhost).")
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = mediaRecorder
        
        const audioChunks: Blob[] = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.push(e.data)
          }
        }

        mediaRecorder.onstop = async () => {
          // Release mic
          stream.getTracks().forEach(track => track.stop())
          
          if (audioChunks.length === 0) return
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          
          setIsLoading(true)
          try {
            const formData = new FormData()
            formData.append("file", audioBlob, "recording.webm")
            
            const res = await fetch("/api/transcribe", {
              method: "POST",
              body: formData
            })
            
            if (res.ok) {
              const data = await res.json()
              if (data.text) {
                // Auto-append or set text
                setInput(prev => (prev + " " + data.text).trim())
              }
            } else {
              console.error("Transcription failed")
              alert("Failed to transcribe audio.")
            }
          } catch (err) {
            console.error("Upload error", err)
          } finally {
            setIsLoading(false)
          }
        }

        mediaRecorder.start()
        setIsListening(true)
      } catch (err) {
        console.error("Could not access microphone", err)
        alert("Microphone access was denied or is not available.")
      }
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userText = input.trim()
    if ((!userText && !selectedImage) || isLoading) return

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: userText,
      ...(selectedImage && { imageUrl: selectedImage })
    }
    
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    const imageToSend = selectedImage
    setSelectedImage(null)
    setIsLoading(true)

    // Placeholder for the AI message we'll stream into
    const aiMsgId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ 
            role: m.role, 
            content: m.content,
            imageUrl: m.imageUrl
          })),
          conversationId,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error("API error")
      }

      const activeConvId = response.headers.get("X-Conversation-Id")
      if (activeConvId && !conversationId) {
        setConversationId(activeConvId)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let finalAiMsg = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") break

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) {
              finalAiMsg += token
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: m.content + token } : m
                )
              )
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (isAutoSpeak && finalAiMsg.trim()) {
        speakText(finalAiMsg)
      }
    } catch (err) {
      console.error("Chat error:", err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: "Sorry, I could not connect to the AI. Please try again." }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col card-tactile p-0 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b-2 border-panel-border flex items-center gap-4 bg-sky-50">
        <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
          <Bot className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Tutor</h2>
          <p className="text-sm font-bold text-primary">Always here to help you learn</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-400 text-lg">Send a message to start learning!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === "user" ? "bg-secondary text-white" : "bg-primary text-white"
              }`}
            >
              {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </div>

            <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`p-4 rounded-2xl whitespace-pre-wrap font-medium border-2 ${
                  msg.role === "user"
                    ? "bg-secondary/10 border-secondary text-foreground rounded-tr-sm"
                    : "bg-white border-panel-border text-foreground rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Attached" className="max-w-full h-auto rounded-xl mb-2 border-2 border-panel-border" />
                )}
                {msg.content || (msg.role === "assistant" && isLoading ? (
                  <span className="text-gray-400 font-bold animate-pulse">Thinking...</span>
                ) : null)}
              </div>
              {msg.role === "assistant" && !isLoading && msg.content && (
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => speakText(msg.content)}
                    className="text-xs text-foreground/50 hover:text-cyan-400 transition-colors flex items-center gap-1"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3 h-3" /> Play
                  </button>
                  {isSpeaking && (
                    <button 
                      onClick={stopSpeaking}
                      className="text-xs text-foreground/50 hover:text-red-400 transition-colors flex items-center gap-1"
                      title="Stop reading"
                    >
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Prompt Chips */}
      <div className="p-4 border-t-2 border-panel-border bg-white flex flex-col">
        {/* Suggested Prompts */}
        {messages.length < 2 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInput(prompt)}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 border-2 border-sky-100 hover:border-primary text-primary rounded-full text-sm font-bold transition-all active:scale-95"
              >
                <Lightbulb className="w-4 h-4" />
                {prompt}
              </button>
            ))}
          </div>
        )}

        {selectedImage && (
          <div className="mb-4 relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 rounded-xl border-2 border-panel-border" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl transition-colors flex items-center justify-center border-2 bg-slate-50 border-panel-border text-gray-500 hover:bg-gray-100"
            title="Attach Image"
          >
            <ImagePlus className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-colors flex items-center justify-center border-2 ${
              isListening 
                ? "bg-error/10 border-error text-error animate-pulse" 
                : "bg-slate-50 border-panel-border text-gray-500 hover:bg-gray-100"
            }`}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isAutoSpeak) stopSpeaking()
              setIsAutoSpeak(!isAutoSpeak)
            }}
            className={`p-3 rounded-xl transition-colors flex items-center justify-center border-2 ${
              isAutoSpeak 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-slate-50 border-panel-border text-gray-500 hover:bg-gray-100"
            }`}
            title={isAutoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
          >
            {isAutoSpeak ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor a question..."
            className="flex-1 bg-slate-50 border-2 border-panel-border rounded-xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary focus:bg-white transition-all min-w-0"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="btn-tactile-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[52px] w-[52px] p-0 shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  )
}
