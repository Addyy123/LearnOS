export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log("[Instrumentation] Starting Xenova pre-warm...");
    try {
      const { pipeline, env } = await import("@xenova/transformers");
      
      // Set cache directory to avoid re-downloading in development
      env.cacheDir = './.cache';
      
      // Pre-warm the embedding model
      console.log("[Instrumentation] Pre-warming feature-extraction model...");
      await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log("[Instrumentation] Pre-warming complete.");
    } catch (error) {
      console.error("[Instrumentation] Failed to pre-warm Xenova model:", error);
    }
  }
}
