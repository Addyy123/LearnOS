import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/modules/identity/auth"

export const contentBuilderTools = {
  searchCurriculum: {
    description: "Search the existing curriculum for concepts to avoid creating duplicates.",
    parameters: z.object({
      query: z.string().describe("The topic to search for")
    }),
    execute: async ({ query }: { query: string }) => {
      const concepts = await prisma.concept.findMany({
        where: {
          name: { contains: query }
        },
        take: 5
      })
      return concepts.map(c => ({ id: c.id, name: c.name, description: c.description }))
    }
  },

  draftConcept: {
    description: "Draft a new curriculum concept. This will require human review before publishing.",
    parameters: z.object({
      name: z.string().describe("Name of the concept"),
      description: z.string().describe("A brief description of what this concept covers")
    }),
    execute: async ({ name, description }: { name: string, description: string }) => {
      // In a real app we'd get tenantId from session, but this is a server-side tool execution
      // We'll just grab the first tenant for MVP demonstration
      const tenant = await prisma.tenant.findFirst()
      if (!tenant) return { error: "No tenant found" }

      const concept = await prisma.concept.create({
        data: {
          tenantId: tenant.id,
          name,
          description,
          version: 1
        }
      })
      return { success: true, conceptId: concept.id, message: `Drafted concept: ${name}` }
    }
  },

  draftQuestion: {
    description: "Draft a practice question for a specific concept. Requires human review.",
    parameters: z.object({
      conceptId: z.string().describe("The ID of the concept this question belongs to"),
      questionText: z.string().describe("The actual question text"),
      options: z.array(z.string()).describe("4 multiple choice options"),
      correctIndex: z.number().describe("The index (0-3) of the correct option"),
      explanation: z.string().describe("An explanation of why the correct answer is right")
    }),
    execute: async ({ conceptId, questionText, options, correctIndex, explanation }: any) => {
      const tenant = await prisma.tenant.findFirst()
      if (!tenant) return { error: "No tenant found" }

      const asset = await prisma.contentAsset.create({
        data: {
          tenantId: tenant.id,
          conceptId,
          type: "QUESTION",
          body: JSON.stringify({
            question: questionText,
            options,
            correctIndex,
            explanation
          }),
          isApproved: false // Explicitly requires human review
        }
      })
      return { success: true, assetId: asset.id, message: "Drafted question successfully." }
    }
  }
}
