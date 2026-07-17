import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Seeding database via API...")

    // 1. Create or get default tenant
    let tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: "Default Tenant" }
      })
      console.log("Created Default Tenant")
    }

    // 2. Create sample concepts (courses)
    let concept1 = await prisma.concept.findUnique({ where: { id: "physics-101" } })
    if (!concept1) {
      concept1 = await prisma.concept.create({
        data: {
          id: "physics-101",
          name: "Physics 101",
          description: "Introductory Physics",
          tenantId: tenant.id
        }
      })
    }

    let concept2 = await prisma.concept.findUnique({ where: { id: "calculus-101" } })
    if (!concept2) {
      concept2 = await prisma.concept.create({
        data: {
          id: "calculus-101",
          name: "Calculus Basics",
          description: "Introductory Calculus",
          tenantId: tenant.id
        }
      })
    }

    // 3. Create Sample Content Assets with Embeddings
    console.log("Generating embeddings for content assets...")
    const { pipeline, env } = await import("@xenova/transformers")
    env.backends.onnx.wasm.numThreads = 1;
    env.allowLocalModels = false // Fetch from HuggingFace

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

    const contents = [
      {
        conceptId: concept1.id,
        body: "Wave-Particle Duality is a fundamental concept of quantum mechanics which asserts that all particles exhibit both wave and particle properties. Light can act as a wave, diffracting around obstacles, but also as a particle (photon), exhibiting the photoelectric effect."
      },
      {
        conceptId: concept1.id,
        body: "Newton's laws of motion laid the foundation for classical mechanics. The first law states an object at rest stays at rest unless acted upon by a force. The second law is F = ma. The third law states every action has an equal and opposite reaction."
      },
      {
        conceptId: concept2.id,
        body: "Calculus is the mathematical study of continuous change. The two primary branches are differential calculus and integral calculus. A derivative represents the rate of change of a function, while an integral represents the accumulation of quantities."
      }
    ]

    for (const c of contents) {
      // Check if already seeded
      const existing = await prisma.contentAsset.findFirst({
        where: { conceptId: c.conceptId, body: c.body }
      })

      if (!existing) {
        // Generate embedding
        const output = await extractor(c.body, { pooling: 'mean', normalize: true })
        const embeddingArray = Array.from(output.data)

        await prisma.contentAsset.create({
          data: {
            tenantId: tenant.id,
            conceptId: c.conceptId,
            type: "LESSON",
            body: c.body,
            embedding: JSON.stringify(embeddingArray),
            isApproved: true
          }
        })
        console.log(`Seeded ContentAsset for concept: ${c.conceptId}`)
      }
    }

    // 3.5 Create Quiz Content Assets (without embeddings, as they are used for practice)
    const quizzes = [
      {
        conceptId: concept1.id,
        type: "QUIZ",
        body: JSON.stringify([
          { question: "What is Wave-Particle Duality?", options: ["Only light is a wave", "All particles exhibit wave and particle properties", "Particles are stationary", "Waves cannot diffract"], answerIndex: 1 },
          { question: "What does Newton's second law state?", options: ["F = ma", "E = mc^2", "Every action has an equal reaction", "Objects stay at rest"], answerIndex: 0 }
        ])
      },
      {
        conceptId: concept2.id,
        type: "QUIZ",
        body: JSON.stringify([
          { question: "What does a derivative represent?", options: ["Accumulation of quantities", "Rate of change of a function", "The area under a curve", "A static value"], answerIndex: 1 },
          { question: "What is the study of continuous change called?", options: ["Algebra", "Geometry", "Calculus", "Statistics"], answerIndex: 2 }
        ])
      }
    ]

    for (const q of quizzes) {
      const existing = await prisma.contentAsset.findFirst({
        where: { conceptId: q.conceptId, type: "QUIZ" }
      })

      if (!existing) {
        await prisma.contentAsset.create({
          data: {
            tenantId: tenant.id,
            conceptId: q.conceptId,
            type: q.type,
            body: q.body,
            isApproved: true
          }
        })
        console.log(`Seeded Quiz for concept: ${q.conceptId}`)
      }
    }

    // 4. Update all existing users with MasteryState for these concepts
    const users = await prisma.user.findMany()
    
    for (const user of users) {
      // Upsert MasteryState for Physics (start at 0 to test Practice)
      await prisma.masteryState.upsert({
        where: {
          userId_conceptId: {
            userId: user.id,
            conceptId: concept1.id
          }
        },
        update: {
          probability: 0.0,
          evidenceCount: 0
        },
        create: {
          userId: user.id,
          conceptId: concept1.id,
          tenantId: tenant.id,
          probability: 0.0,
          evidenceCount: 0
        }
      })

      // Upsert MasteryState for Calculus
      await prisma.masteryState.upsert({
        where: {
          userId_conceptId: {
            userId: user.id,
            conceptId: concept2.id
          }
        },
        update: {
          probability: 0.0,
          evidenceCount: 0
        },
        create: {
          userId: user.id,
          conceptId: concept2.id,
          tenantId: tenant.id,
          probability: 0.0,
          evidenceCount: 0
        }
      })
      console.log(`Reset MasteryStates for user ${user.email}`)
    }

    return NextResponse.json({ message: "Database seeding complete!" }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 })
  }
}
