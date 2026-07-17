import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Triggered asynchronously when a learner fails a concept practice.
 * This background agent will review their plan and insert remedial steps if necessary.
 */
export async function runStudyPlannerAgent(userId: string, failedConceptId: string) {
  try {
    const activePlan = await prisma.plan.findFirst({
      where: { userId },
      include: {
        items: {
          include: { concept: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activePlan) return;

    // Get learner's recent learning events for this concept
    const recentEvents = await prisma.learningEvent.findMany({
      where: { userId, conceptId: failedConceptId },
      orderBy: { occurredAt: 'desc' },
      take: 5
    });

    // Check if they failed 3 times recently
    const recentFails = recentEvents.filter(e => e.isCorrect === false).length;
    if (recentFails < 3) return; // Not enough failure density to intervene

    console.log(`[StudyPlanner Agent] Triggered for Learner ${userId} on Concept ${failedConceptId}`);

    const failedConcept = await prisma.concept.findUnique({ where: { id: failedConceptId } });
    if (!failedConcept) return;

    // Run the agent to figure out what to do
    const { text, toolCalls } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are the LearnOS Study Planner Agent.
A learner is repeatedly failing the concept "${failedConcept.name}".
Your job is to identify a foundational/prerequisite concept that they should review instead, and insert it into their learning plan before the current step.
Use the insertRemedialStep tool to add the review step.`,
      prompt: `The learner failed "${failedConcept.name}" ${recentFails} times recently. Find a prerequisite and insert it into Plan ${activePlan.id}.`,
      tools: {
        insertRemedialStep: tool({
          description: "Insert a prerequisite concept as a review step in the learner's active plan.",
          parameters: z.object({
            planId: z.string().describe("The ID of the plan to modify"),
            prerequisiteConceptName: z.string().describe("The name of a simpler, foundational concept to search for")
          }),
          execute: async ({ planId, prerequisiteConceptName }) => {
            // Find a concept matching the prerequisite name
            const prereq = await prisma.concept.findFirst({
              where: { name: { contains: prerequisiteConceptName } }
            });

            if (!prereq) {
              return { success: false, message: `Could not find concept matching ${prerequisiteConceptName}` };
            }

            // Find the order of the failed concept in the plan
            const failedItem = activePlan.items.find(i => i.conceptId === failedConceptId);
            const insertOrder = failedItem ? failedItem.order : 0;

            // Shift everything down
            await prisma.planItem.updateMany({
              where: { planId, order: { gte: insertOrder } },
              data: { order: { increment: 1 } }
            });

            // Insert the remedial step
            await prisma.planItem.create({
              data: {
                planId,
                conceptId: prereq.id,
                status: "PENDING",
                order: insertOrder
              }
            });

            return { success: true, message: `Successfully inserted ${prereq.name} into the learning plan at step ${insertOrder}.` };
          }
        })
      },
      maxSteps: 3
    });

    console.log("[StudyPlanner Agent] Finished.", text, toolCalls);

  } catch (error) {
    console.error("[StudyPlanner Agent] Failed to run:", error);
  }
}
