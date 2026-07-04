from ai_helper import ask_ai


def run(result):

    # Skip review for short/action-oriented responses to save API credits
    # Bumped threshold from 100 to 200 to avoid wasting credits on medium-length responses
    if len(result) < 200:
        return result

    # Truncate very long inputs to prevent doubling token costs
    review_text = result
    if len(result) > 2000:
        review_text = result[:2000] + "\n... [response truncated for review]"

    prompt = f"""
Review this answer for clarity, grammar, and helpfulness.

IMPORTANT RULES:
- Do NOT change any factual information in the answer. The facts come from live web search results and are more up-to-date than your training data.
- Do NOT say events "haven't happened yet" if the answer says they have — the answer is based on real-time web data.
- Only fix grammar, clarity, tone, and formatting.
- Keep the answer concise and conversational.
- Return ONLY the improved answer text, nothing else (no "Review:", no explanations of changes).

Answer to review:

{review_text}
"""

    reviewed = ask_ai(prompt)

    # If the AI returned something useful, use it; otherwise return original
    if reviewed and len(reviewed.strip()) > 10:
        return reviewed
    return result
