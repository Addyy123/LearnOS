import os
import sys
import tempfile

# Adjust path to find multi_agent modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools import file_tool  # noqa: E402
from tools import profile_tool  # noqa: E402
from tools import sandbox_tool  # noqa: E402
from tools import system_tool  # noqa: E402

print("=== Starting Multi-Agent Tools Verification ===")

# --- Use a temp directory for profile tests to avoid mutating production data ---
ORIGINAL_PROFILE = profile_tool.PROFILE_FILE
test_profile_dir = tempfile.mkdtemp()
test_profile_file = os.path.join(test_profile_dir, "test_profile.json")
profile_tool.PROFILE_FILE = test_profile_file

try:
    # Test Profile Tool
    print("\n[Testing Profile Tool]")
    print("bulk update profile...")
    p_update = profile_tool.update_profile_bulk(
        {"name": "Adi Test", "preferred_language": "Python"}
    )
    print("Update response:", p_update)
    profile = profile_tool.read_profile()
    print("Loaded profile details:", profile)
    assert profile.get("name") == "Adi Test"

    # Test Sandbox Tool
    print("\n[Testing Sandbox Tool]")
    code = """
import sys
print("Hello from Sandbox!")
print("Version:", sys.version.split()[0])
"""
    run_res = sandbox_tool.run_python_code(code)
    print("Execution Result:", run_res)
    assert run_res["success"] is True
    assert "Hello from Sandbox!" in run_res["stdout"]

    # Test Syntax Error catching in Sandbox
    print("\n[Testing Sandbox Error Catching]")
    bad_code = "print(invalid_var_name"
    bad_res = sandbox_tool.run_python_code(bad_code)
    print("Bad code status success:", bad_res["success"])
    print("Stderr:", bad_res["stderr"].strip())
    assert bad_res["success"] is False

    # Test Sandbox Blocked Patterns
    print("\n[Testing Sandbox Security]")
    dangerous_code = "import subprocess\nsubprocess.run(['ls'])"
    block_res = sandbox_tool.run_python_code(dangerous_code)
    print("Blocked code success:", block_res["success"])
    assert block_res["success"] is False
    assert "Blocked" in block_res["stderr"] or "restricted" in block_res["stderr"]

    # Test File Tool
    print("\n[Testing File Tool]")
    temp_file = "test_run_file.txt"
    print("Creating file...")
    cr = file_tool.create_file(temp_file, "This is file content!\nOriginal text.")
    print(cr)
    print("Reading file content:")
    rf = file_tool.read_file(temp_file)
    print(rf)
    assert "Original text." in rf

    print("Editing file...")
    ed = file_tool.edit_file(temp_file, "Original text.", "Modified text.")
    print(ed)
    rf2 = file_tool.read_file(temp_file)
    print(rf2)
    assert "Modified text." in rf2

    print("Listing dir:")
    ld = file_tool.list_directory(".")
    print(ld[:200] + "...")

    print("Deleting file:")
    df = file_tool.delete_file(temp_file)
    print(df)

    # Test System Tool (Process Check)
    print("\n[Testing System Tool Process Check]")
    p_check = system_tool.check_running_processes("python")
    print(p_check[:300] + "...")

    print("\n=== Verification Completed Successfully! ===")

finally:
    # Restore original profile path and clean up temp file
    profile_tool.PROFILE_FILE = ORIGINAL_PROFILE
    try:
        os.remove(test_profile_file)
        os.rmdir(test_profile_dir)
    except Exception:
        pass
