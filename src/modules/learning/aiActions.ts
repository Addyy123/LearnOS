"use server"

import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { QUIZ_GENERATOR_V1 } from "@/lib/ai/prompts"

export async function generateQuizForConcept(conceptId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("Unauthorized")

  // Check if a quiz already exists just in case
  const existingQuiz = await prisma.contentAsset.findFirst({
    where: {
      conceptId,
      type: "QUIZ"
    }
  })

  if (existingQuiz) {
    return { success: true }
  }

  // Get the lesson content to generate questions from
  const lessonAsset = await prisma.contentAsset.findFirst({
    where: {
      conceptId,
      type: { in: ["LESSON", "ARTICLE"] }
    }
  })

  if (!lessonAsset) {
    throw new Error("No lesson content found to generate a quiz from.")
  }

  // Call Groq AI
  const prompt = `${QUIZ_GENERATOR_V1}
    
    LESSON CONTENT:
    ${lessonAsset.body}
  `

  const fallbackModels = ["llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"];
  let response;
  let fetchError = null;

  for (const model of fallbackModels) {
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2
        }),
      });

      if (response.ok) {
        fetchError = null;
        break;
      } else {
        fetchError = await response.text();
        console.warn(`Groq quiz generation model ${model} failed:`, fetchError);
      }
    } catch (err) {
      fetchError = err;
      console.warn(`Groq quiz generation model ${model} network error:`, err);
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to generate quiz via AI. Last error: ${fetchError}`);
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  // Parse to ensure it's valid JSON matching our expected shape
  let parsed
  try {
    parsed = JSON.parse(content)
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid format returned by AI")
    }
  } catch (err) {
    throw new Error("AI returned malformed JSON")
  }

  // Save as a new asset
  await prisma.contentAsset.create({
    data: {
      tenantId: user.tenantId,
      conceptId,
      type: "QUIZ",
      body: JSON.stringify(parsed.questions),
      isApproved: true
    }
  })

  revalidatePath(`/curriculum/${conceptId}/practice`)
  return { success: true }
}
