import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { contentBuilderTools } from '@/modules/learning/agents/ContentBuilderTools';
import { auth } from '@/modules/identity/auth';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EDUCATOR") {
    return new Response('Unauthorized - Must be an educator', { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    system: `You are the LearnOS Content Builder Agent.
You are an expert curriculum designer assisting an educator.
You have tools to search the curriculum, draft new concepts, and draft practice questions.
When drafting questions, ensure they are high quality and pedagogical. 
ALWAYS tell the user when you have successfully drafted a concept or question.
Note: Everything you draft is marked 'isApproved: false' and will require human review.`,
    messages,
    tools: {
      searchCurriculum: tool({
        description: contentBuilderTools.searchCurriculum.description,
        parameters: contentBuilderTools.searchCurriculum.parameters,
        execute: contentBuilderTools.searchCurriculum.execute,
      }),
      draftConcept: tool({
        description: contentBuilderTools.draftConcept.description,
        parameters: contentBuilderTools.draftConcept.parameters,
        execute: contentBuilderTools.draftConcept.execute,
      }),
      draftQuestion: tool({
        description: contentBuilderTools.draftQuestion.description,
        parameters: contentBuilderTools.draftQuestion.parameters,
        execute: contentBuilderTools.draftQuestion.execute,
      }),
    },
    maxSteps: 5 // Allow the agent to call multiple tools in a row
  });

  return result.toDataStreamResponse();
}
