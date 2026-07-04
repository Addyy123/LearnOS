import os

# Define the root of your workspace (e.g., the directory containing note.txt)
WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def is_safe_path(filepath, base_dir=WORKSPACE_DIR):
    r"""
    Resolves filepath and checks if it lies strictly inside base_dir.
    This prevents directory traversal attacks (e.g., '..\..\Windows') and path-based attacks.
    """
    # If the path is relative, resolve it against the workspace (not CWD)
    if not os.path.isabs(filepath):
        filepath = os.path.join(base_dir, filepath)

    # Use realpath to resolve symbolic links and relative segments
    # Use normcase for case-insensitive comparison on Windows
    real_filepath = os.path.normcase(os.path.realpath(filepath))
    real_base_dir = os.path.normcase(os.path.realpath(base_dir))

    try:
        # Check if the common path is the workspace directory
        common = os.path.commonpath([real_filepath, real_base_dir])
        return common == real_base_dir
    except ValueError:
        return False


def create_file(filepath, content=""):
    """Create a new file with the specified content, creating directories if needed."""
    if not os.path.isabs(filepath):
        filepath = os.path.join(WORKSPACE_DIR, filepath)
    if not is_safe_path(filepath):
        return f"Permission Denied: File path '{filepath}' is outside the allowed workspace."
    try:
        # Resolve folder path if any
        dir_name = os.path.dirname(filepath)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return f"File created successfully at: {filepath}"
    except Exception as e:
        return f"Failed to create file: {str(e)}"


def create_directory(dirpath):
    """Create a new directory."""
    if not os.path.isabs(dirpath):
        dirpath = os.path.join(WORKSPACE_DIR, dirpath)
    if not is_safe_path(dirpath):
        return f"Permission Denied: Directory path '{dirpath}' is outside the allowed workspace."
    try:
        os.makedirs(dirpath, exist_ok=True)
        return f"Directory created successfully at: {dirpath}"
    except Exception as e:
        return f"Failed to create directory: {str(e)}"


def read_file(filepath):
    """Read the content of a file."""
    if not os.path.isabs(filepath):
        filepath = os.path.join(WORKSPACE_DIR, filepath)
    if not is_safe_path(filepath):
        return f"Permission Denied: File path '{filepath}' is outside the allowed workspace."
    try:
        if not os.path.exists(filepath):
            return f"Error: File '{filepath}' does not exist."
        if os.path.isdir(filepath):
            return f"Error: '{filepath}' is a directory, not a file."
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        return f"Failed to read file: {str(e)}"


def edit_file(filepath, search_text, replace_text):
    """Edit an existing file by replacing occurrences of search_text with replace_text."""
    if not os.path.isabs(filepath):
        filepath = os.path.join(WORKSPACE_DIR, filepath)
    if not is_safe_path(filepath):
        return f"Permission Denied: File path '{filepath}' is outside the allowed workspace."
    try:
        if not os.path.exists(filepath):
            return f"Error: File '{filepath}' does not exist."
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        if search_text not in content:
            return f"Error: Search text not found in '{filepath}'."

        new_content = content.replace(search_text, replace_text)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        return f"Successfully updated '{filepath}' by replacing search text."
    except Exception as e:
        return f"Failed to edit file: {str(e)}"


def delete_file(filepath):
    """Delete a file."""
    if not os.path.isabs(filepath):
        filepath = os.path.join(WORKSPACE_DIR, filepath)
    if not is_safe_path(filepath):
        return f"Permission Denied: File path '{filepath}' is outside the allowed workspace."
    try:
        if not os.path.exists(filepath):
            return f"Error: File '{filepath}' does not exist."
        if os.path.isdir(filepath):
            return f"Error: '{filepath}' is a directory. Use directory deletion tools if needed."
        os.remove(filepath)
        return f"Successfully deleted file: {filepath}"
    except Exception as e:
        return f"Failed to delete file: {str(e)}"


def move_file_or_directory(src_path, dest_path):
    """Move or rename a file or directory."""
    import shutil

    if not os.path.isabs(src_path):
        src_path = os.path.join(WORKSPACE_DIR, src_path)
    if not os.path.isabs(dest_path):
        dest_path = os.path.join(WORKSPACE_DIR, dest_path)

    if not is_safe_path(src_path):
        return f"Permission Denied: Source path '{src_path}' is outside the allowed workspace."
    if not is_safe_path(dest_path):
        return f"Permission Denied: Destination path '{dest_path}' is outside the allowed workspace."

    try:
        if not os.path.exists(src_path):
            return f"Error: Source '{src_path}' does not exist."

        shutil.move(src_path, dest_path)
        return f"Successfully moved/renamed from '{src_path}' to '{dest_path}'"
    except Exception as e:
        return f"Failed to move file/directory: {str(e)}"


def _validate_directory(dirpath):
    if not os.path.isabs(dirpath):
        dirpath = os.path.join(WORKSPACE_DIR, dirpath)
    if not is_safe_path(dirpath):
        return None, f"Permission Denied: Directory path '{dirpath}' is outside the allowed workspace."
    if not os.path.exists(dirpath):
        return None, f"Error: Directory '{dirpath}' does not exist."
    if not os.path.isdir(dirpath):
        return None, f"Error: '{dirpath}' is a file, not a directory."
    return dirpath, None


def list_directory(dirpath="."):
    """List all files and subdirectories in the specified directory path."""
    valid_dir, err = _validate_directory(dirpath)
    if err:
        return err
    try:
        items = os.listdir(valid_dir)
        files, dirs = [], []
        for item in items:
            if os.path.isdir(os.path.join(valid_dir, item)):
                dirs.append(item + "/")
            else:
                files.append(item)

        result = []
        if dirs:
            result.append("Directories:\n  " + "\n  ".join(sorted(dirs)))
        if files:
            result.append("Files:\n  " + "\n  ".join(sorted(files)))

        return "\n\n".join(result) if result else "Directory is empty."
    except Exception as e:
        return f"Failed to list directory: {str(e)}"


def _search_single_file(file_path, dirpath, query):
    file_matches = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line_num, line in enumerate(f, 1):
                if query.lower() in line.lower():
                    file_matches.append(
                        f"{os.path.relpath(file_path, dirpath)}:L{line_num}: {line.strip()}"
                    )
    except Exception:
        pass  # Skip unreadable
    return file_matches


def search_text_in_files(dirpath, query):
    """Search recursively for a text query in all files within the directory (ignores hidden dirs and pycache)."""
    valid_dir, err = _validate_directory(dirpath)
    if err:
        return err
    try:
        ignored_dirs = {".git", "__pycache__", ".gemini", ".idea", ".vscode", "node_modules", "venv", "env"}
        matches = []

        for root, dirs, files in os.walk(valid_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]
            for file in files:
                matches.extend(_search_single_file(os.path.join(root, file), valid_dir, query))

        if not matches:
            return f"No occurrences of '{query}' found in '{dirpath}'."

        if len(matches) > 30:
            return "\n".join(matches[:30]) + f"\n... and {len(matches) - 30} more matches."
        return "\n".join(matches)
    except Exception as e:
        return f"Search failed: {str(e)}"
