import os

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

# Prioritize .env file to avoid stale environment variables in the terminal
env_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
)
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("OPENROUTER_API_KEY="):
                OPENROUTER_API_KEY = line.strip().split("=", 1)[1].strip(" \"'")
                break

if not OPENROUTER_API_KEY:
    print(
        "[WARNING] OPENROUTER_API_KEY environment variable is not set! AI calls will fail."
    )
    print("  Set it with: set OPENROUTER_API_KEY=sk-or-v1-your-key-here")
OPENROUTER_BASE_URL = "https://api.groq.com/openai/v1"

# Cheap model on OpenRouter to conserve credits
MODEL_NAME = "llama-3.1-8b-instant"
MAX_TOKENS = 1024
