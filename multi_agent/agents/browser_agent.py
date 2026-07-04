from ai_helper import ask_ai, ask_ai_with_history
from tools import browser_tool
import re


def _extract_query_for_site(task, site_name):
    """Extract the search query by removing site-related words from the task."""

    cleaned = task.lower()
    remove_words = [
        site_name,
        "on",
        "in",
        "search",
        "find",
        "look",
        "for",
        "open",
        "show",
        "me",
        "the",
        "a",
        "an",
        "please",
        "can",
        "you",
        "up",
    ]

    # Build a single regex to remove all these words as whole words
    pattern = r"\b(?:" + "|".join(remove_words) + r")\b"
    cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

    # Remove leading/trailing non-alphanumeric punctuation left over
    cleaned = re.sub(r"^[^\w]+|[^\w]+$", "", cleaned)

    # Clean up extra spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned if cleaned else task


def run(task, history=None):
    """Browser agent - decides which browser tool to use and executes it."""

    task_lower = task.lower()

    # ---- Keyword shortcuts (no AI call needed, saves credits) ----

    # YouTube
    if "youtube" in task_lower:
        query = _extract_query_for_site(task, "youtube")
        print(f"[Browser Agent] Action: youtube_search | Query: {query}")
        return browser_tool.youtube_search(query)

    # Amazon
    if "amazon" in task_lower:
        query = _extract_query_for_site(task, "amazon")
        print(f"[Browser Agent] Action: amazon_search | Query: {query}")
        return browser_tool.amazon_search(query)

    # Flipkart
    if "flipkart" in task_lower:
        query = _extract_query_for_site(task, "flipkart")
        print(f"[Browser Agent] Action: site_search | Site: flipkart | Query: {query}")
        return browser_tool.site_search("flipkart", query)

    # GitHub
    if "github" in task_lower:
        query = _extract_query_for_site(task, "github")
        print(f"[Browser Agent] Action: site_search | Site: github | Query: {query}")
        return browser_tool.site_search("github", query)

    # Wikipedia
    if "wikipedia" in task_lower or "wiki" in task_lower:
        query = _extract_query_for_site(task, "wikipedia")
        query = _extract_query_for_site(query, "wiki")
        print(f"[Browser Agent] Action: site_search | Site: wikipedia | Query: {query}")
        return browser_tool.site_search("wikipedia", query)

    # Reddit
    if "reddit" in task_lower:
        query = _extract_query_for_site(task, "reddit")
        print(f"[Browser Agent] Action: site_search | Site: reddit | Query: {query}")
        return browser_tool.site_search("reddit", query)

    # ---- AI-based fallback for other browser tasks ----

    prompt = f"""
You are a browser agent. Decide what action to take.

Available actions:
- google_search: Search Google for information
- youtube_search: Search YouTube for videos
- amazon_search: Search Amazon for products
- read_webpage: Read content from a specific URL
- open_website: Open a website in the browser

Task: {task}

Respond in this exact format (two lines only):
ACTION: <action_name>
QUERY: <search query or URL>
"""

    # Use history-aware AI call if history is available
    if history:
        system_prompt = (
            "You are a browser agent that decides which browser tool to use."
        )
        result = ask_ai_with_history(system_prompt, history, prompt).strip()
    else:
        result = ask_ai(prompt).strip()

    # Parse the AI's decision
    action_match = re.search(r"ACTION:\s*(.+)", result, re.IGNORECASE)
    query_match = re.search(r"QUERY:\s*(.+)", result, re.IGNORECASE)

    action = action_match.group(1).strip().lower() if action_match else ""
    query = query_match.group(1).strip() if query_match else ""

    print(f"[Browser Agent] Action: {action} | Query: {query}")

    # Execute the chosen tool
    if action == "google_search":
        return browser_tool.google_search(query)

    elif action == "youtube_search":
        return browser_tool.youtube_search(query)

    elif action == "amazon_search":
        return browser_tool.amazon_search(query)

    elif action == "read_webpage":
        return browser_tool.read_webpage(query)

    elif action == "open_website":
        return browser_tool.open_website(query)

    else:
        # Default to google search
        return browser_tool.google_search(task)
