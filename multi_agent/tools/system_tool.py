import subprocess
import os
import re

# Map of common app names to their Windows commands
APP_MAP = {
    # Windows built-in apps
    "calculator": "calc",
    "calc": "calc",
    "notepad": "notepad",
    "paint": "mspaint",
    "wordpad": "wordpad",
    "snipping tool": "SnippingTool",
    "snip": "SnippingTool",
    "task manager": "taskmgr",
    "taskmgr": "taskmgr",
    "cmd": "cmd",
    "command prompt": "cmd",
    "terminal": "wt",
    "powershell": "powershell",
    "control panel": "control",
    "settings": "ms-settings:",
    "file explorer": "explorer",
    "explorer": "explorer",
    "registry editor": "regedit",
    "disk cleanup": "cleanmgr",
    "device manager": "devmgmt.msc",
    "system info": "msinfo32",
    "resource monitor": "resmon",
    "performance monitor": "perfmon",
    "character map": "charmap",
    "magnifier": "magnify",
    "on-screen keyboard": "osk",
    "sticky notes": "explorer.exe shell:AppsFolder\\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe!App",
    "clock": "ms-clock:",
    "alarm": "ms-clock:",
    "camera": "microsoft.windows.camera:",
    "maps": "bingmaps:",
    "weather": "bingweather:",
    "store": "ms-windows-store:",
    "microsoft store": "ms-windows-store:",
    "xbox": "xbox:",
    "mail": "outlookmail:",
    "calendar": "outlookcal:",
    "photos": "ms-photos:",
    # Popular third-party apps
    "chrome": "chrome",
    "google chrome": "chrome",
    "firefox": "firefox",
    "edge": "msedge",
    "microsoft edge": "msedge",
    "brave": "brave",
    "opera": "opera",
    "vscode": "code",
    "vs code": "code",
    "visual studio code": "code",
    "spotify": "spotify",
    "discord": "discord",
    "telegram": "telegram",
    "whatsapp": "explorer.exe shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gnamwwy4!App",
    "vlc": "vlc",
    "obs": "obs64",
    "steam": "steam",
    "zoom": "zoom",
    "teams": "msteams",
    "microsoft teams": "msteams",
    "word": "winword",
    "excel": "excel",
    "powerpoint": "powerpnt",
    "outlook": "outlook",
}

# Map app names to their process names for closing
PROCESS_MAP = {
    "calculator": "CalculatorApp.exe",
    "calc": "CalculatorApp.exe",
    "notepad": "notepad.exe",
    "paint": "mspaint.exe",
    "chrome": "chrome.exe",
    "google chrome": "chrome.exe",
    "firefox": "firefox.exe",
    "edge": "msedge.exe",
    "microsoft edge": "msedge.exe",
    "vscode": "Code.exe",
    "vs code": "Code.exe",
    "word": "WINWORD.EXE",
    "excel": "EXCEL.EXE",
    "powerpoint": "POWERPNT.EXE",
    "spotify": "Spotify.exe",
    "discord": "Discord.exe",
    "vlc": "vlc.exe",
    "teams": "msteams.exe",
    "zoom": "Zoom.exe",
}


def _sanitize_name(name):
    """Remove any characters that are not alphanumeric, spaces, dots, or hyphens."""
    return re.sub(r"[^a-zA-Z0-9 .\-]", "", name).strip()


def open_app(app_name):
    """Open a system application by name."""

    app_lower = app_name.lower().strip()

    # Try exact match first
    if app_lower in APP_MAP:
        command = APP_MAP[app_lower]
    else:
        # Try partial match
        matched = None
        for key, cmd in APP_MAP.items():
            if app_lower in key or key in app_lower:
                matched = cmd
                break

        if matched:
            command = matched
        else:
            # Block arbitrary execution
            return f"Security Error: App '{app_name}' is not in the pre-approved whitelist."

    try:
        # Handle Windows URI schemes (ms-settings:, ms-clock:, etc.)
        if (
            ":" in command
            and not command.endswith(".exe")
            and not command.endswith(".msc")
        ):
            os.startfile(command)
        elif " " in command:
            # Commands with arguments (e.g., "explorer.exe shell:AppsFolder\\...")
            # Split only the first part as executable, rest as args
            parts = command.split(" ", 1)
            subprocess.Popen([parts[0], parts[1]])
        else:
            # Safe: no shell=True, runs the whitelisted command directly
            subprocess.Popen([command])

        return f"Opened {app_name} successfully."

    except Exception as e:
        return f"Could not open {app_name}: {str(e)}"


def close_app(app_name):
    """Close a running application by name."""

    app_lower = _sanitize_name(app_name.lower())

    process = PROCESS_MAP.get(app_lower, f"{app_lower}.exe")

    # Validate process name: must be a simple filename (no paths, no shell metacharacters)
    if not re.match(r"^[a-zA-Z0-9_.\-]+$", process):
        return f"Security Error: Invalid process name '{process}'."

    try:
        # Safe: no shell=True, using list-form args
        result = subprocess.run(
            ["taskkill", "/IM", process, "/F"], capture_output=True, text=True
        )
        if result.returncode == 0:
            return f"Closed {app_name}."
        else:
            error_msg = result.stderr.strip() or result.stdout.strip()
            return f"Could not close {app_name}: {error_msg}"

    except Exception as e:
        return f"Could not close {app_name}: {str(e)}"


def list_apps():
    """Return list of supported apps."""

    categories = {
        "Windows Built-in": [
            "calculator",
            "notepad",
            "paint",
            "task manager",
            "cmd",
            "terminal",
            "powershell",
            "control panel",
            "settings",
            "file explorer",
            "snipping tool",
        ],
        "Browsers": ["chrome", "firefox", "edge", "brave", "opera"],
        "Microsoft Office": ["word", "excel", "powerpoint", "outlook"],
        "Other Apps": [
            "vscode",
            "spotify",
            "discord",
            "telegram",
            "vlc",
            "steam",
            "zoom",
            "teams",
        ],
    }

    output = "Supported apps:\n\n"
    for category, apps in categories.items():
        output += f"  {category}: {', '.join(apps)}\n"

    return output


def check_running_processes(process_name=None):
    """Check running processes using tasklist command on Windows."""
    try:
        # Safe: no shell=True
        result = subprocess.run(
            ["tasklist"], capture_output=True, text=True, errors="ignore"
        )
        lines = result.stdout.splitlines()

        if process_name:
            proc_clean = _sanitize_name(process_name.lower()).replace(".exe", "")
            found_instances = []
            for line in lines:
                if proc_clean in line.lower():
                    found_instances.append(line.strip())
            if found_instances:
                return (
                    f"Process '{process_name}' is running. Instances found:\n"
                    + "\n".join(found_instances)
                )
            else:
                return f"Process '{process_name}' is NOT running."
        else:
            if len(lines) > 40:
                return (
                    "\n".join(lines[:40])
                    + f"\n... [truncated, total {len(lines)} processes running]"
                )
            return "\n".join(lines)
    except Exception as e:
        return f"Failed to check running processes: {str(e)}"


def run_workspace_command(command, timeout=15):
    """
    Run a terminal command inside the workspace directory (e.g. 'python script.py', 'pytest').
    This is used by the debugger agent to verify fixes.
    """
    import shlex
    workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    
    # Very basic safety block for highly destructive commands
    blocked = ["rm -rf /", "del /s /q C:\\", "format", "mkfs"]
    for b in blocked:
        if b in command:
            return f"Error: Command '{command}' is blocked for safety."
            
    try:
        # Use shell=True for windows commands but with a timeout
        result = subprocess.run(
            command,
            cwd=workspace_dir,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        output = result.stdout.strip()
        err = result.stderr.strip()
        
        if result.returncode == 0:
            return f"Success (Exit code 0):\n{output}\n{err}".strip()
        else:
            return f"Failed (Exit code {result.returncode}):\nStdout:\n{output}\nStderr:\n{err}".strip()
            
    except subprocess.TimeoutExpired:
        return f"Error: Command '{command}' timed out after {timeout} seconds."
    except Exception as e:
        return f"Error executing command: {str(e)}"
