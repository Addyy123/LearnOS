import subprocess
import os
import sys
import uuid
import re

# Dangerous patterns to block before execution
BLOCKED_PATTERNS = [
    r"\bos\.system\b",
    r"\bos\.popen\b",
    r"\bos\.exec\w*\b",
    r"\bos\.remove\b",
    r"\bos\.unlink\b",
    r"\bos\.rmdir\b",
    r"\bos\.rename\b",
    r"\bshutil\.rmtree\b",
    r"\bshutil\.move\b",
    r"\bsubprocess\b",
    r"\b__import__\b",
    r"\beval\s*\(\s*input",
    r"\bexec\s*\(\s*input",
    r"\bopen\s*\(.*(\/etc|C:\\\\Windows|System32)",
    r"\bimport\s+ctypes\b",
    r"\bimport\s+winreg\b",
]


def _check_code_safety(code_string):
    """Check code for dangerous patterns. Returns (is_safe, reason)."""
    for pattern in BLOCKED_PATTERNS:
        match = re.search(pattern, code_string, re.IGNORECASE)
        if match:
            return (
                False,
                f"Blocked: Code contains restricted operation '{match.group()}'. This operation is not allowed in the sandbox.",
            )
    return True, ""


def run_python_code(code_string, timeout=10):
    """Writes Python code to a temporary file, executes it in a subprocess, and returns output."""
    # Basic safety: reject extremely large code inputs
    if len(code_string) > 50000:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Error: Code is too large (max 50,000 characters).",
            "exit_code": -3,
        }

    # Check for dangerous operations
    is_safe, reason = _check_code_safety(code_string)
    if not is_safe:
        return {"success": False, "stdout": "", "stderr": reason, "exit_code": -4}

    sandbox_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sandbox"
    )
    os.makedirs(sandbox_dir, exist_ok=True)

    # Snapshot existing files before execution for cleanup
    pre_existing = set(os.listdir(sandbox_dir))

    # Generate unique filename to allow concurrent runs
    temp_filename = f"sandbox_{uuid.uuid4().hex}.py"
    temp_filepath = os.path.join(sandbox_dir, temp_filename)

    try:
        # Write code to file
        with open(temp_filepath, "w", encoding="utf-8") as f:
            f.write(code_string)

        # Run code in subprocess
        # Use sys.executable to ensure we use the same Python interpreter
        result = subprocess.run(
            [sys.executable, temp_filepath],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=sandbox_dir,  # Run it inside sandbox directory
        )

        stdout = result.stdout
        stderr = result.stderr
        exit_code = result.returncode

        return {
            "success": exit_code == 0,
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": exit_code,
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Error: Code execution timed out after {timeout} seconds.",
            "exit_code": -1,
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Error during sandbox execution: {str(e)}",
            "exit_code": -2,
        }
    finally:
        # Cleanup: remove temp file and any new files created by the sandbox run
        try:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        except Exception:
            pass

        # Clean up any files/dirs created during execution
        try:
            post_existing = set(os.listdir(sandbox_dir))
            new_items = post_existing - pre_existing
            for item in new_items:
                item_path = os.path.join(sandbox_dir, item)
                try:
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                    elif os.path.isdir(item_path):
                        import shutil

                        shutil.rmtree(item_path, ignore_errors=True)
                except Exception:
                    pass
        except Exception:
            pass
