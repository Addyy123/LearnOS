from react_engine.agent import ReActAgent
from tools.file_tool import read_file, edit_file, search_text_in_files
from tools.system_tool import run_workspace_command


def run(task, history=None):
    """Debugger Agent - an autonomous self-healing agent that fixes bugs in the workspace."""

    debugger_tools = [
        {
            "name": "search_files",
            "description": "Searches for a text query across all files in the workspace. Use this to find where an error occurred. Arguments: dirpath (string, e.g. '.'), query (string)",
            "func": lambda args: search_text_in_files(
                args.get("dirpath", "."), args.get("query", "")
            ),
        },
        {
            "name": "read_file",
            "description": "Read the content of a specific file. Arguments: filepath (string)",
            "func": lambda args: read_file(args.get("filepath", "")),
        },
        {
            "name": "edit_file",
            "description": "Edits a file by replacing specific text. Make sure search_text exactly matches what is in the file. Arguments: filepath (string), search_text (string), replace_text (string)",
            "requires_approval": True,
            "func": lambda args: edit_file(
                args.get("filepath", ""),
                args.get("search_text", ""),
                args.get("replace_text", ""),
            ),
        },
        {
            "name": "run_command",
            "description": "Run a terminal command in the workspace to test your fix (e.g., 'python script.py'). Arguments: command (string)",
            "requires_approval": True,
            "func": lambda args: run_workspace_command(args.get("command", "")),
        },
    ]

    agent = ReActAgent("DebuggerAgent", tools=debugger_tools, max_iterations=20)

    prompt = (
        f"You are the Autonomous Debugger Agent.\n"
        f"The user has encountered a bug or error in their codebase.\n"
        f"Your task is to fix it autonomously.\n\n"
        f"Steps to follow:\n"
        f"1. Search the codebase for the relevant file using 'search_files'.\n"
        f"2. Read the file using 'read_file'.\n"
        f"3. Apply your fix using 'edit_file'.\n"
        f"4. Verify the fix by running the code or tests using 'run_command'.\n"
        f"5. If 'run_command' fails, read the new error, edit the file again, and retry.\n"
        f"6. Do NOT finish until 'run_command' succeeds and proves the bug is fixed.\n\n"
        f"User Request:\n{task}"
    )

    result = agent.run(prompt, history=history)
    return result
