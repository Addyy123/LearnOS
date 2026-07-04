import time
from openai import OpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, MODEL_NAME, MAX_TOKENS

client = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
)


def _call_with_retry(messages, retries=3):
    """Internal helper: calls the AI API with automatic retry on rate limit errors.
    Shared by ask_ai and ask_ai_with_history to avoid code duplication."""

    last_error = None

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=MAX_TOKENS,
            )
            return response.choices[0].message.content

        except Exception as e:
            last_error = str(e)

            if "429" in last_error or "rate" in last_error.lower():
                wait = (attempt + 1) * 5  # Reduced from 15s to 5s, 10s, 15s
                print(f"[Rate limited] Waiting {wait}s before retry...")
                time.sleep(wait)

            else:
                print(f"[AI Error] {last_error}")
                raise RuntimeError(f"AI call failed: {last_error}")

    raise RuntimeError(
        f"Rate limit exceeded after {retries} retries. Please wait and try again."
    )


def ask_ai(prompt, retries=3):
    """Call AI via OpenRouter with automatic retry on rate limit errors."""
    messages = [{"role": "user", "content": prompt}]
    return _call_with_retry(messages, retries=retries)


def ask_ai_with_history(
    system_prompt, conversation_history, current_message, retries=3
):
    """Call AI with full conversation history for context-aware responses."""

    messages = [{"role": "system", "content": system_prompt}]

    # Add past conversation history (last 10 turns to save tokens)
    recent_history = conversation_history[-10:]
    for entry in recent_history:
        messages.append({"role": "user", "content": entry["user"]})
        messages.append({"role": "assistant", "content": entry["assistant"]})

    # Add the current message
    messages.append({"role": "user", "content": current_message})

    return _call_with_retry(messages, retries=retries)
