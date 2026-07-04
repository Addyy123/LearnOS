import json
from ai_helper import ask_ai
from tools import sandbox_tool

SYSTEM_PROMPT = """You are an expert developer agent. You can write Python code and run it in a sandbox environment to test if it works.
Your objective is to write the code that solves the user's task, execute it, check for errors, and self-correct until the code runs successfully and accomplishes the task.

To run code in the sandbox, respond in the following format:
THOUGHT: <your reasoning about the code and what it needs to do>
ACTION: run_python_code
CODE:
```python
<your python code here>
```

When you are satisfied that the code runs correctly and accomplishes the task, respond in the following format:
THOUGHT: <your reasoning that the task is finished>
ACTION: finish
CODE:
```python
<the final successful python code>
```
"""


def run(task, history=None):
    """Coding Agent - writes code, runs it in a subprocess sandbox, and debugs compilation/runtime errors in a loop."""
    steps = []
    current_prompt = f"User Request:\n{task}"

    # Track last known code and stderr for the fallback at the end of the loop
    last_code = ""
    last_stderr = ""

    # Run up to 4 iterations
    for loop_count in range(4):
        full_prompt = SYSTEM_PROMPT + "\n\n"
        if history:
            full_prompt += "Conversation history context:\n"
            for h in history[-5:]:
                full_prompt += f"User: {h['user']}\nAssistant: {h['assistant']}\n"
            full_prompt += "\n"

        full_prompt += current_prompt
        if steps:
            full_prompt += "\n\nPrevious runs:\n"
            for step in steps:
                full_prompt += (
                    f"Attempt {step['attempt']}:\n"
                    f"Code executed:\n{step['code']}\n"
                    f"Execution Status: {'Success' if step['success'] else 'Failed'}\n"
                    f"Stdout:\n{step['stdout']}\n"
                    f"Stderr:\n{step['stderr']}\n\n"
                )

        response = ask_ai(full_prompt)

        # Parse thought, action, code block
        # Multi-line thought extraction: capture everything between THOUGHT: and ACTION:/CODE:/end
        thought = ""
        action = None
        code = ""

        # Extract multi-line thought (everything from THOUGHT: to ACTION:)
        import re

        thought_match = re.search(
            r"THOUGHT:\s*(.*?)(?=\nACTION:|\nCODE:|\Z)",
            response,
            re.DOTALL | re.IGNORECASE,
        )
        if thought_match:
            thought = thought_match.group(1).strip()

        # Extract action
        action_match = re.search(r"ACTION:\s*(.+)", response, re.IGNORECASE)
        if action_match:
            action = action_match.group(1).strip().lower()

        # Extract the code block inside ```python ... ```
        code_match = re.search(
            r"```python\s*\n(.*?)\n```", response, re.DOTALL | re.IGNORECASE
        )
        if code_match:
            code = code_match.group(1).strip()
        elif "```python" in response.lower():
            # Fallback if closing ``` is missing
            code = re.split(r"```python", response, maxsplit=1, flags=re.IGNORECASE)[
                1
            ].strip()

        # Update last known values
        if code:
            last_code = code

        if not action or action == "finish":
            # If we have code, return it formatted; otherwise return the raw thought/response
            if code:
                return f"{thought}\n\nHere is the final python code:\n```python\n{code}\n```"
            elif thought:
                return thought
            else:
                return response

        if action == "run_python_code":
            if not code:
                observation = "Error: No Python code block found in your response. Make sure to use ```python syntax."
                success = False
                stdout, stderr = "", observation
            else:
                run_res = sandbox_tool.run_python_code(code)
                success = run_res["success"]
                stdout = run_res["stdout"]
                stderr = run_res["stderr"]

            print(
                f"[Coding Agent] Executed sandbox code. Success: {success} | Err: {bool(stderr)}"
            )

            last_stderr = stderr

            steps.append(
                {
                    "attempt": len(steps) + 1,
                    "code": code,
                    "success": success,
                    "stdout": stdout,
                    "stderr": stderr,
                }
            )
        else:
            return f"Coding Agent output unrecognized format: {response}"

    return f"Failed to successfully complete the coding task. Here is the last attempt:\n```python\n{last_code}\n```\nError:\n{last_stderr}"
