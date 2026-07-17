import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/modules/identity/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as Blob | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Call Groq Whisper API
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 })
    }

    const groqFormData = new FormData()
    groqFormData.append("file", file, "audio.webm")
    groqFormData.append("model", "distil-whisper-large-v3-en")
    groqFormData.append("response_format", "json")

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error("Groq Whisper error:", errorData)
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ text: data.text })
  } catch (error: any) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
