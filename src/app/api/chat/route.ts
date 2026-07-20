import { auth } from "@/modules/identity/auth"
import { prisma } from "@/lib/prisma"
import { SAFETY_GUARD_V1, TUTOR_PROMPT_V1 } from "@/lib/ai/prompts"
import { checkRateLimit } from "@/lib/security/rateLimit"
import { logger } from "@/lib/observability/logger"
import { validateCSRF } from "@/lib/security/csrf"
import { NextResponse } from "next/server"

function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const maxDuration = 30;

export async function POST(req: Request) {
  const csrfError = await validateCSRF();
  if (csrfError) return csrfError;

  try {
    const session = await auth();
    let sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!checkRateLimit(sessionUserId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        plans: {
          include: { items: { include: { concept: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { messages, conversationId, teachingMode } = await req.json();

    let activeConversationId = conversationId;
    
    // Create new conversation if missing
    if (!activeConversationId) {
      const conv = await prisma.aiConversation.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
        }
      });
      activeConversationId = conv.id;
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    let contextString = "";
    
    if (lastMessage && lastMessage.role === "user") {
      let safetyCheckOk = false;
      let safetyVerdict = "SAFE";
      for (const safetyModel of ["llama-3.1-8b-instant", "llama3-8b-8192"]) {
        try {
          const safetyCheck = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: safetyModel,
              messages: [
                { role: "system", content: SAFETY_GUARD_V1 },
                { role: "user", content: lastMessage.content }
              ],
              max_tokens: 10,
              temperature: 0
            })
          });

          if (safetyCheck.ok) {
            const safetyData = await safetyCheck.json();
            safetyVerdict = safetyData.choices?.[0]?.message?.content?.trim() || "SAFE";
            safetyCheckOk = true;
            break;
          }
        } catch (e) {
          logger.warn(`Safety check failed on model ${safetyModel}`, { error: e });
        }
      }

      let isUnsafe = false;
      if (safetyCheckOk && safetyVerdict.includes("UNSAFE")) {
        isUnsafe = true;
      }

      await prisma.aiMessage.create({
        data: {
          conversationId: activeConversationId,
          role: "user",
          content: lastMessage.content,
          safetyFlag: isUnsafe
        }
      });

      if (isUnsafe) {
        logger.warn(`Blocked unsafe prompt from user ${user.id}`, { prompt: lastMessage.content });
        const encoder = new TextEncoder();
        const blockedStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: {"choices":[{"delta":{"content":"I cannot fulfill that request as it violates our safety and academic integrity guidelines."}}]}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          }
        });
        
        return new Response(blockedStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Conversation-Id": activeConversationId
          },
        });
      }

      // RAG: Generate embedding for user prompt
      try {
        logger.info("Loading transformers with WASM backend...");
        const { pipeline, env } = await import("@xenova/transformers");
        
        // Force WebAssembly backend to prevent Windows Node native freeze
        env.backends.onnx.wasm.numThreads = 1;
        env.allowLocalModels = false;
        
        logger.info("Initializing feature extraction pipeline...");
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        logger.info("Generating embedding for user prompt...");
        const output = await extractor(lastMessage.content, { pooling: 'mean', normalize: true });
        const questionVector = Array.from(output.data) as number[];

        logger.info("Fetching content assets from DB...");
        const assets = await prisma.contentAsset.findMany({
          where: { tenantId: user.tenantId }
        });

        // Compute similarity
        const scoredAssets = assets
          .filter(a => a.embedding)
          .map(a => {
            const assetVector = JSON.parse(a.embedding!) as number[];
            const score = cosineSimilarity(questionVector, assetVector);
            return { body: a.body, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3); // Top 3 matches

        if (scoredAssets.length > 0) {
          contextString = "\n\nUse the following strictly verified curriculum context to answer the user's question:\n" + 
            scoredAssets.map(a => `- ${a.body}`).join('\n');
          logger.info("RAG context injected successfully!");
        }
      } catch (err) {
        logger.error("Error during RAG processing", err);
      }
    }

    // Fetch user's active goals
    const activeGoals = await prisma.goal.findMany({
      where: { userId: user.id, status: "ACTIVE" }
    });
    
    let goalsContext = `\n\nThe user currently has a ${user.currentStreak}-day learning streak. Encourage them to keep it up!`;
    if (activeGoals.length > 0) {
      goalsContext += `\n\nThe user's current active goals are:\n${activeGoals.map(g => `- ${g.title}`).join('\n')}\nPlease tailor your teaching and examples to help them achieve these goals when relevant.`;
    }

    // Inject Active Subject Context
    let subjectContext = "";
    if (user.plans && user.plans.length > 0) {
      const activePlan = user.plans[0];
      subjectContext = `\n\nThe user's primary focus right now is learning: ${activePlan.title}. Relate explanations to this broader subject if possible.`;
    }
    
    // Inject Teaching Mode
    let modeContext = "";
    if (teachingMode === "test") {
      modeContext = "\n\nTEACHING MODE: 'Test Me'. Ask a question to test their understanding right now. Do not explain the concept yet.";
    } else if (teachingMode === "walkthrough") {
      modeContext = "\n\nTEACHING MODE: 'Walk me through it'. Provide step 1 of the solution. Wait for them to complete step 1 before giving step 2.";
    } else {
      modeContext = "\n\nTEACHING MODE: 'Explain it'. Provide a clear, conceptual explanation using a relatable analogy.";
    }

    // Token-budget conversation memory management
    // We aim to keep the input under roughly 3000 tokens (approx 12000 chars) for fast response times.
    const CHAR_BUDGET = 12000;
    let currentChars = contextString.length + goalsContext.length;
    let recentMessages = [];
    
    // Iterate backwards through messages to prioritize the most recent context
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgLength = typeof msg.content === 'string' ? msg.content.length : 100;
      if (currentChars + msgLength < CHAR_BUDGET) {
        recentMessages.unshift(msg);
        currentChars += msgLength;
      } else {
        break; // Budget exceeded
      }
    }
    
    // Fallback: Always include the very last message even if it blows the budget slightly
    if (recentMessages.length === 0 && messages.length > 0) {
      recentMessages.push(messages[messages.length - 1]);
    }

    let hasImage = false;
    const formattedMessages = recentMessages.map((m: any) => {
      if (m.imageUrl) {
        hasImage = true;
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Analyze this image." },
            { type: "image_url", image_url: { url: m.imageUrl } }
          ]
        }
      }
      return { role: m.role, content: m.content };
    });    const fallbackModels = hasImage ? ["llama-3.2-11b-vision-preview"] : ["llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"];
    let response;
    let targetModel = fallbackModels[0];
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
            max_tokens: 800,
            messages: [
              {
                role: "system",
                content:
                  TUTOR_PROMPT_V1 + contextString + goalsContext + subjectContext + modeContext,
              },
              ...formattedMessages,
            ],
            stream: true,
          }),
        });

        if (response.ok) {
          targetModel = model;
          fetchError = null;
          break; // Success! Break out of the fallback loop
        } else {
          fetchError = await response.text();
          logger.warn(`Groq model ${model} failed`, { error: fetchError });
        }
      } catch (err) {
        fetchError = err;
        logger.warn(`Groq model ${model} network error`, { error: err });
      }
    }

    if (!response || !response.ok) {
      logger.error("All fallback models failed", fetchError);
      
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: {"choices":[{"delta":{"content":"I'm currently experiencing high demand and need a moment to recover. Please try asking your question again in a few seconds."}}]}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      
      return new Response(errorStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Conversation-Id": activeConversationId
        },
      });
    }

    // Intercept stream to save AI response to DB
    const [stream1, stream2] = response.body!.tee();

    (async () => {
      const reader = stream2.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiContent = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices[0].delta?.content) {
                  aiContent += data.choices[0].delta.content;
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
        
        if (aiContent.trim()) {
          await prisma.aiMessage.create({
            data: {
              conversationId: activeConversationId,
              role: "assistant",
              content: aiContent
            }
          });

          // Rough token estimation: 1 token ~= 4 characters for English text
          // Calculate input tokens (context + messages) + output tokens (aiContent)
          const totalInputLength = contextString.length + goalsContext.length + formattedMessages.reduce((acc: number, m: any) => acc + (typeof m.content === 'string' ? m.content.length : 100), 0);
          const estimatedTokens = Math.ceil((totalInputLength + aiContent.length) / 4);

          await prisma.aITokenUsage.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              model: targetModel,
              estimatedTokens: estimatedTokens
            }
          });
        }
      } catch (e) {
        logger.error("Error saving AI message to DB", e);
      }
    })();

    // Stream the raw SSE response directly to the browser
    return new Response(stream1, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": activeConversationId
      },
    });
  } catch (error) {
    logger.error("AI Route Error", error);
    return new Response(JSON.stringify({ error: "Failed to connect to AI" }), { status: 500 });
  }
}
