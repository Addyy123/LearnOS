"use client"

import { useRef, useEffect, useState } from "react"
import { Send, User, Bot, Mic, MicOff, Volume2, VolumeX, Square, ImagePlus, X, Lightbulb, Copy, Check, Plus, Menu, Search, MessageSquare, PlusCircle } from "lucide-react"
import { getUserConversations } from "@/modules/learning/aiActions"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
  const [teachingMode, setTeachingMode] = useState("explain")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [isListening, setIsListening] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const [isAutoSpeak, setIsAutoSpeak] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  type ConversationPreview = {
    id: string;
    createdAt: Date;
    conceptName: string | null;
    preview: string;
  }
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter(c => 
    c.preview.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.conceptName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [isLoading])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const loadConversations = async () => {
    try {
      const data = await getUserConversations()
      // Fix date types that get serialized from server action
      setConversations(data.map(d => ({ ...d, createdAt: new Date(d.createdAt) })))
    } catch (err) {
      console.error(err)
    }
  }

  const loadConversation = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/history?conversationId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setConversationId(id)
        if (window.innerWidth < 768) setIsSidebarOpen(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    setConversationId(null)
    setMessages([])
    if (window.innerWidth < 768) setIsSidebarOpen(false)
  }

  useEffect(() => {
    loadConversations()
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
          teachingMode,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error("API error")
      }

      const activeConvId = response.headers.get("X-Conversation-Id")
      if (activeConvId && !conversationId) {
        setConversationId(activeConvId)
        loadConversations() // refresh sidebar when new chat is created
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

  const handleSendPrompt = (prompt: string) => {
    setInput(prompt)
    // We need to wait for state to update, or just bypass state for this submission
    setTimeout(() => {
      const formEvent = new Event('submit', { cancelable: true, bubbles: true }) as unknown as React.FormEvent;
      // We manually construct the message
      if (isLoading) return
      
      const userMsg: Message = { 
        id: Date.now().toString(), 
        role: "user", 
        content: prompt
      }
      
      const newMessages = [...messages, userMsg]
      setMessages(newMessages)
      setInput("")
      setIsLoading(true)
      
      const aiMsgId = (Date.now() + 1).toString()
      setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }])
      
      // Fire off API request
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ 
            role: m.role, 
            content: m.content
          })),
          conversationId,
          teachingMode,
        }),
      }).then(async (response) => {
        if (!response.ok || !response.body) throw new Error("API error")
        
        const activeConvId = response.headers.get("X-Conversation-Id")
        if (activeConvId && !conversationId) {
          setConversationId(activeConvId)
          loadConversations()
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
                setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: m.content + token } : m))
              }
            } catch {}
          }
        }
        if (isAutoSpeak && finalAiMsg.trim()) speakText(finalAiMsg)
      }).catch(err => {
        console.error(err)
        setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: "Sorry, error connecting." } : m))
      }).finally(() => setIsLoading(false))

    }, 10)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex card-tactile p-0 overflow-hidden mb-16 md:mb-0 relative min-h-0">
      
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute md:relative z-50 h-full bg-[var(--panel-bg)] border-[var(--panel-border)] transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        ${isSidebarOpen ? "w-72 border-r-2 opacity-100 translate-x-0" : "w-0 border-r-0 opacity-0 -translate-x-10"}
      `}>
        <div className="w-72 h-full flex flex-col shrink-0">
          <div className="p-4 border-b-2 border-[var(--panel-border)] flex flex-col gap-4">
          <button 
            onClick={startNewChat}
            className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle className="w-5 h-5" /> New Chat
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 border-2 border-transparent focus:border-primary rounded-xl pl-9 pr-4 py-2 text-sm font-medium outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                conversationId === conv.id 
                  ? "border-primary bg-primary/10" 
                  : "border-transparent hover:bg-black/5"
              }`}
            >
              <div className="text-sm font-bold text-foreground line-clamp-1">{conv.preview}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-foreground/50 font-medium">
                  {conv.conceptName || "General Chat"}
                </span>
                <span className="text-xs text-foreground/40 font-medium">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
          {filteredConversations.length === 0 && (
            <div className="text-center p-4 text-sm text-foreground/50 font-medium">
              No conversations found.
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[var(--background)] min-w-0">
        {/* Chat Header */}
        <div className="p-4 border-b-2 border-[var(--panel-border)] flex items-center gap-4 bg-[var(--panel-bg)] shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-black/5 hover:bg-black/10 transition-colors shrink-0"
            title="Toggle chat history"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">AI Tutor</h2>
            <p className="text-sm font-bold text-primary truncate">Always here to help you learn</p>
          </div>
        </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/5">
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
                    ? "bg-secondary/10 border-secondary/30 text-foreground rounded-tr-sm"
                    : "bg-[var(--panel-bg)] border-[var(--panel-border)] text-foreground rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Attached" className="max-w-full h-auto rounded-xl mb-2 border-2 border-panel-border" />
                )}
                {msg.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props) {
                        const {children, className, node, ...rest} = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <pre className="bg-black/10 p-2 rounded-md overflow-x-auto text-sm font-mono mt-2 mb-2">
                            <code className={className} {...rest}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-black/10 px-1 py-0.5 rounded text-sm font-mono text-primary" {...rest}>
                            {children}
                          </code>
                        )
                      },
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold my-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-md font-bold my-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-primary hover:underline font-bold" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-extrabold text-foreground" {...props} />,
                      table: ({node, ...props}) => <table className="w-full border-collapse my-4 text-sm" {...props} />,
                      th: ({node, ...props}) => <th className="border-b-2 border-primary/20 p-2 text-left font-bold" {...props} />,
                      td: ({node, ...props}) => <td className="border-b border-primary/10 p-2" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (msg.role === "assistant" && isLoading ? (
                  <span className="text-gray-400 font-bold animate-pulse">Thinking...</span>
                ) : null)}
              </div>
              {msg.role === "assistant" && !isLoading && msg.content && (
                <div className="flex gap-4 mt-1">
                  <button 
                    onClick={() => speakText(msg.content)}
                    className="text-xs text-foreground/50 hover:text-primary transition-colors flex items-center gap-1 font-bold"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Play
                  </button>
                  {isSpeaking && (
                    <button 
                      onClick={stopSpeaking}
                      className="text-xs text-foreground/50 hover:text-red-400 transition-colors flex items-center gap-1 font-bold"
                      title="Stop reading"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  )}
                  <button 
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="text-xs text-foreground/50 hover:text-primary transition-colors flex items-center gap-1 font-bold"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <><Check className="w-3.5 h-3.5 text-secondary" /> Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Prompt Chips */}
      <div className="p-3 md:p-4 border-t-2 border-[var(--panel-border)] bg-[var(--panel-bg)] flex flex-col gap-2">

        {/* Row 1: Prompt chips + mode selector — horizontally scrollable on mobile */}
        {messages.length < 2 && !isLoading && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:border-primary text-primary rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                {prompt}
              </button>
            ))}
            <div className="ml-auto shrink-0">
              <select
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value)}
                className="bg-[var(--panel-border)] text-foreground font-bold text-xs rounded-xl px-3 py-1.5 border border-[var(--panel-border)] outline-none focus:border-primary whitespace-nowrap"
              >
                <option value="explain" className="bg-[var(--panel-bg)] text-foreground">Explain it</option>
                <option value="walkthrough" className="bg-[var(--panel-bg)] text-foreground">Walk me through it</option>
                <option value="test" className="bg-[var(--panel-bg)] text-foreground">Test me</option>
              </select>
            </div>
          </div>
        )}

        {/* When no chips showing, still show mode selector alone */}
        {(messages.length >= 2 || isLoading) && (
          <div className="flex justify-end">
            <select
              value={teachingMode}
              onChange={(e) => setTeachingMode(e.target.value)}
              className="bg-[var(--panel-border)] text-foreground font-bold text-xs rounded-xl px-3 py-1.5 border border-[var(--panel-border)] outline-none focus:border-primary"
            >
              <option value="explain" className="bg-[var(--panel-bg)] text-foreground">Explain it</option>
              <option value="walkthrough" className="bg-[var(--panel-bg)] text-foreground">Walk me through it</option>
              <option value="test" className="bg-[var(--panel-bg)] text-foreground">Test me</option>
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-[var(--panel-bg)] border-2 border-[var(--panel-border)] focus-within:border-primary rounded-2xl p-2 transition-all shadow-sm">
          {selectedImage && (
            <div className="relative inline-block ml-2 mt-2 w-max">
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

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="p-2.5 rounded-xl transition-colors flex items-center justify-center text-muted-foreground hover:bg-black/10 bg-black/5 mb-0.5"
              title="More options"
            >
              {showOptions ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>
            
            {showOptions && (
              <div className="flex items-center gap-2 animate-fade-in mb-0.5">
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
                  className="p-2.5 rounded-xl transition-colors flex items-center justify-center text-muted-foreground hover:bg-black/10 bg-black/5"
                  title="Attach Image"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${
                    isListening 
                      ? "bg-error/10 text-error animate-pulse" 
                      : "text-gray-500 hover:bg-black/10 bg-black/5"
                  }`}
                  title={isListening ? "Stop listening" : "Start speaking"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isAutoSpeak) stopSpeaking()
                    setIsAutoSpeak(!isAutoSpeak)
                  }}
                  className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${
                    isAutoSpeak 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-500 hover:bg-black/10 bg-black/5"
                  }`}
                  title={isAutoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
                >
                  {isAutoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask your tutor a question..."
              className="flex-1 bg-transparent resize-none px-2 py-2.5 text-foreground font-medium focus:outline-none min-h-[44px] max-h-[200px]"
              disabled={isLoading}
              rows={1}
              autoFocus
            />
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="btn-tactile-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-11 w-11 p-0 shrink-0 mb-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}
