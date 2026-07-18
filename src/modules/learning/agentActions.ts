"use server"

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/modules/identity/auth';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function runContentBuilderAgent(prompt: string) {
  const session = await auth();
  // @ts-ignore
  if (!session?.user?.id || session.user.role !== 'EDUCATOR') {
    throw new Error('Unauthorized: Only Educators can run the Content Builder Agent.');
  }

  // @ts-ignore
  const tenantId = session.user.tenantId;

  try {
    const result = await generateText({
      // @ts-ignore
      model: groq('llama-3.3-70b-versatile'),
      prompt: `You are an expert curriculum builder agent for an adaptive learning platform. Your job is to fulfill the educator's request. 
      Use your tools sequentially to create the curriculum structure, write the lesson content, and generate a diagnostic quiz.
      IMPORTANT RULES:
      1. Always call createConcept FIRST to get a conceptId.
      2. Then call writeLessonContent using that conceptId.
      3. Then call writeDiagnosticQuiz using that conceptId.
      
      Educator Request: ${prompt}`,
      tools: {
        createConcept: tool({
          description: 'Creates a new Concept in the database',
          parameters: z.object({
            name: z.string().describe('The title of the concept'),
            description: z.string().describe('A short description of the concept'),
          }),
          execute: async ({ name, description }) => {
            const concept = await prisma.concept.create({
              data: {
                tenantId,
                name,
                description,
              }
            });
            return { conceptId: concept.id, message: `Created concept: ${name}` };
          },
        }),
        writeLessonContent: tool({
          description: 'Writes the detailed lesson body in JSON array format and links it to a concept',
          parameters: z.object({
            conceptId: z.string().describe('The ID of the concept to attach this lesson to'),
            content: z.array(z.object({
              type: z.enum(['h1', 'h2', 'p', 'ul']),
              text: z.string()
            })).describe('The lesson content structured as an array of blocks')
          }),
          execute: async ({ conceptId, content }) => {
            const asset = await prisma.contentAsset.create({
              data: {
                tenantId,
                conceptId,
                type: 'LESSON',
                body: JSON.stringify(content),
                isApproved: false, // Agent generated content is always DRAFT
              }
            });
            return { assetId: asset.id, message: `Created lesson content for concept ${conceptId}` };
          },
        }),
        writeDiagnosticQuiz: tool({
          description: 'Writes a 3-question multiple choice quiz for a concept',
          parameters: z.object({
            conceptId: z.string(),
            questions: z.array(z.object({
              question: z.string(),
              options: z.array(z.string()),
              correctIndex: z.number(),
              explanation: z.string()
            })).length(3)
          }),
          execute: async ({ conceptId, questions }) => {
            const asset = await prisma.contentAsset.create({
              data: {
                tenantId,
                conceptId,
                type: 'QUIZ',
                body: JSON.stringify(questions),
                isApproved: false,
              }
            });
            return { assetId: asset.id, message: `Created quiz for concept ${conceptId}` };
          }
        })
      },
      maxSteps: 5,
    });
    
    return { success: true, text: result.text };
  } catch (err: any) {
    console.error("Agent execution failed:", err);
    return { success: false, error: err.message || "Failed to execute agent." };
  }
}
