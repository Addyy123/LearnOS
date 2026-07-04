from tools import file_tool
from react_engine.agent import ReActAgent

file_tools_def = [
    {
        "name": "create_file",
        "description": "Creates a new file with the given content. Arguments: filepath (string), content (string).",
        "requires_approval": True,
        "func": file_tool.create_file,
    },
    {
        "name": "read_file",
        "description": "Reads the contents of a file. Arguments: filepath (string).",
        "func": file_tool.read_file,
    },
    {
        "name": "edit_file",
        "description": "Replaces search_text with replace_text in a file. Arguments: filepath (string), search_text (string), replace_text (string).",
        "requires_approval": True,
        "func": file_tool.edit_file,
    },
    {
        "name": "delete_file",
        "description": "Deletes a file. Arguments: filepath (string).",
        "requires_approval": True,
        "func": file_tool.delete_file,
    },
    {
        "name": "list_directory",
        "description": "Lists contents of a directory. Arguments: dirpath (string). Defaults to '.' if not provided.",
        "func": file_tool.list_directory,
    },
    {
        "name": "search_text_in_files",
        "description": "Searches for text across files in a directory. Arguments: dirpath (string), query (string).",
        "func": file_tool.search_text_in_files,
    },
    {
        "name": "create_directory",
        "description": "Creates a new folder/directory. Arguments: dirpath (string).",
        "requires_approval": True,
        "func": file_tool.create_directory,
    },
    {
        "name": "move_file_or_directory",
        "description": "Moves or renames a file or directory from one path to another. Arguments: src_path (string), dest_path (string).",
        "requires_approval": True,
        "func": file_tool.move_file_or_directory,
    },
]


def run(task, history=None):
    """File Agent - uses the robust ReAct engine to perform file operations."""
    agent = ReActAgent(name="File Agent", tools=file_tools_def, max_iterations=7)

    # We append a critical instruction so the agent doesn't get confused about folders vs files.
    enhanced_task = (
        f"{task}\n\n"
        f"CRITICAL INSTRUCTION: If asked to save text into a folder/directory, you CANNOT write text directly to a folder. "
        f"You MUST use create_directory to make the folder, and then use create_file to create a file inside it (e.g., 'folder_name/data.txt')."
    )

    return agent.run(enhanced_task, history)
