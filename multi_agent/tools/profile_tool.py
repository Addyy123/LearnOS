import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILE_FILE = os.path.join(BASE_DIR, "memory", "user_profile.json")


def read_profile():
    """Reads the user profile JSON file. Returns a dict."""
    if not os.path.exists(PROFILE_FILE):
        return {}
    try:
        with open(PROFILE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def update_profile(key, value):
    """Updates a single key-value pair in the user profile."""
    profile = read_profile()
    profile[key] = value
    try:
        os.makedirs(os.path.dirname(PROFILE_FILE), exist_ok=True)
        with open(PROFILE_FILE, "w", encoding="utf-8") as f:
            json.dump(profile, f, indent=4)
        return f"Profile updated: {key} = {value}"
    except Exception as e:
        return f"Failed to update profile: {str(e)}"


def update_profile_bulk(data_dict):
    """Updates multiple key-value pairs in the user profile."""
    profile = read_profile()
    profile.update(data_dict)
    try:
        os.makedirs(os.path.dirname(PROFILE_FILE), exist_ok=True)
        with open(PROFILE_FILE, "w", encoding="utf-8") as f:
            json.dump(profile, f, indent=4)
        return "Profile updated successfully."
    except Exception as e:
        return f"Failed to update profile: {str(e)}"
