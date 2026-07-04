import re
from tools import system_tool


def run(task, history=None):
    """System agent - opens, closes, or manages system apps."""

    task_lower = task.lower()

    # Detect if user wants to list apps (check first — most specific)
    if any(
        phrase in task_lower
        for phrase in ["list apps", "what apps", "which apps", "supported apps"]
    ):
        return system_tool.list_apps()

    # Detect if user wants to check processes or if something is running
    process_phrases = [
        "check process",
        "is running",
        "running processes",
        "list processes",
        "tasklist",
        "check if",
    ]
    if any(phrase in task_lower for phrase in process_phrases):
        app_name = _extract_app_name(task)
        # Clean up process-related words to find actual app name
        for w in [
            "processes",
            "process",
            "running",
            "list",
            "tasklist",
            "is",
            "any",
            "check",
            "if",
        ]:
            app_name = re.sub(r"\b" + w + r"\b", "", app_name).strip()
        app_name = re.sub(r"\s+", " ", app_name).strip()
        print(f"[System Agent] Checking process: {app_name if app_name else 'All'}")
        return system_tool.check_running_processes(app_name if app_name else None)

    # Detect if user wants to close an app (only if the intent is clearly about closing)
    close_words = ["close", "kill", "quit", "exit", "terminate", "end"]
    if any(re.search(r"\b" + w + r"\b", task_lower) for w in close_words):
        # Make sure "close" is about an app, not something else
        app_name = _extract_app_name(task)
        if app_name:
            print(f"[System Agent] Closing: {app_name}")
            return system_tool.close_app(app_name)

    # Default: open the app
    app_name = _extract_app_name(task)
    print(f"[System Agent] Opening: {app_name}")
    return system_tool.open_app(app_name)


def _extract_app_name(task):
    """Extract the app name from the user's task."""

    cleaned = task.lower()

    # Remove common filler words
    remove_words = [
        "open",
        "launch",
        "start",
        "run",
        "close",
        "kill",
        "stop",
        "exit",
        "quit",
        "terminate",
        "end",
        "the",
        "a",
        "an",
        "my",
        "please",
        "can",
        "you",
        "app",
        "application",
        "program",
        "software",
        "for",
        "me",
        "on",
        "up",
        "now",
    ]

    pattern = r"\b(?:" + "|".join(remove_words) + r")\b"
    cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

    # Remove leading/trailing non-alphanumeric punctuation
    cleaned = re.sub(r"^[^\w]+|[^\w]+$", "", cleaned)

    # Clean up extra spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned if cleaned else task
