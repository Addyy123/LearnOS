import json
from tools.profile_tool import read_profile, update_profile_bulk
from agents.memory_agent import search_memory
from react_engine.agent import ReActAgent

# Import agent runs
from agents.research_agent import run as research_run
from agents.coding_agent import run as coding_run
from agents.file_agent import run as file_run
from agents.browser_agent import run as browser_run
from agents.reviewer_agent import run as reviewer_run
from agents.system_agent import run as system_run
from agents.chat_agent import run as chat_run
from agents.debugger_agent import run as debugger_run

import inspect


def wrap_with_history(agent_func, history):
    # Pass history to sub-agents if they support it
    def wrapper(*args, **kwargs):
        # Handle cases where the LLM hallucinates argument names instead of using 'task'
        if args:
            # Convert non-string args to a readable format
            task = (
                str(args[0])
                if not isinstance(args[0], (dict, list))
                else json.dumps(args[0])
            )
        elif "task" in kwargs:
            task = str(kwargs.pop("task"))
            # If the LLM passed other kwargs alongside task, append them
            if kwargs:
                task += f" (Additional info: {json.dumps(kwargs)})"
        else:
            # If no 'task' was provided, convert whatever was provided into the task string
            task = json.dumps(kwargs) if kwargs else "No task specified"

        # Check if the agent function accepts a 'history' keyword argument
        sig = inspect.signature(agent_func)
        if "history" in sig.parameters:
            return agent_func(task, history=history)
        else:
            return agent_func(task)

    return wrapper


def route_task(task, history=None):
    """Orchestrates collaborative agents using the new ReAct Engine."""
    task_lower = task.lower()

    # 1. Capture user profile facts dynamically
    if "my name is" in task_lower:
        name_parts = task_lower.split("my name is", 1)[1].strip().split()
        if name_parts:
            name = name_parts[0].rstrip(".,!?").capitalize()
            update_profile_bulk({"name": name})
    if "my preferred language is" in task_lower:
        lang = task_lower.split("my preferred language is", 1)[1].strip().rstrip(".,!?")
        update_profile_bulk({"preferred_language": lang})

    # Load profile context to append
    profile = read_profile()
    profile_str = ""
    if profile:
        profile_str = f"\n[User Profile Context: {json.dumps(profile)}]"

    # Search Vector DB for RAG context
    rag_context = search_memory(task)
    rag_str = ""
    if rag_context:
        rag_str = f"\n[Relevant Past Memory:\n{rag_context}\n]"

    # Fast route simple greetings or brief chats to save tokens and latency
    # Only fast-route if message is clearly conversational — check against action keywords
    action_keywords = [
        "search",
        "open",
        "run",
        "file",
        "create",
        "make",
        "close",
        "kill",
        "stop",
        "check",
        "list",
        "delete",
        "edit",
        "read",
        "write",
        "play",
        "launch",
        "weather",
        "code",
        "build",
        "fix",
        "debug",
        "download",
        "install",
        "browse",
        "find",
        "show",
        "help",
        "explain",
        "tell",
        "calculate",
        "convert",
        "translate",
        "summarize",
        "analyze",
    ]
    chat_greetings = [
        "hi",
        "hello",
        "hey",
        "hii",
        "how are you",
        "what is your name",
        "who are you",
        "what time is it",
        "good morning",
        "good evening",
        "good night",
        "thanks",
        "thank you",
        "bye",
        "goodbye",
    ]

    is_greeting = any(
        task_lower.strip() == g
        or task_lower.startswith(g + " ")
        or task_lower.startswith(g + ",")
        for g in chat_greetings
    )
    is_short = len(task_lower.split()) <= 2
    has_action_keyword = any(kw in task_lower for kw in action_keywords)

    if (is_greeting or is_short) and not has_action_keyword:
        print("\n[Orchestrator fast-routing to chat]")
        chat_task = task
        if profile_str or rag_str:
            chat_task = f"{task}\n{profile_str}{rag_str}"
        return chat_run(chat_task, history=history)

    # Define tools for the Orchestrator
    orchestrator_tools = [
        {
            "name": "system",
            "description": "Opens/closes desktop apps and checks running processes. Pass the full user request. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(system_run, history),
        },
        {
            "name": "browser",
            "description": "Opens websites, searches Google/YouTube, reads webpages. Pass the full user request. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(browser_run, history),
        },
        {
            "name": "research",
            "description": "Deep analysis and conceptual explanations (no internet/file access). Pass the full user request. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(research_run, history),
        },
        {
            "name": "coding",
            "description": "Writes code and tests it in sandbox. Pass the full user request. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(coding_run, history),
        },
        {
            "name": "file",
            "description": "File system operations (create, read, edit, delete files/folders). Pass the full user request. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(file_run, history),
        },
        {
            "name": "chat",
            "description": "Simple greetings, chatting, profile updates. Pass the full user request. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(chat_run, history),
        },
        {
            "name": "debugger",
            "description": "Autonomous self-healing agent. Use this to fix bugs, errors, or refactor code in the actual workspace. Pass the full user request including the error message. Arguments: task (string, required - the user's request)",
            "func": wrap_with_history(debugger_run, history),
        },
    ]

    orchestrator = ReActAgent(
        "Orchestrator", tools=orchestrator_tools, max_iterations=15
    )

    # Run the orchestrator loop
    enhanced_task = f"{task}{profile_str}{rag_str}\n\nDecompose the task and call the appropriate specialized agents to fulfill it. If one agent produces a result, you might need to pass that result as the task to the next agent."

    final_ans = orchestrator.run(enhanced_task, history=history)

    # Reviewer Agent checks the final answer
    print("\n[Reviewer Agent checking...]")
    reviewed_ans = reviewer_run(final_ans)

    return reviewed_ans
