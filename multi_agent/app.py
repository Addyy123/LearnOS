import os
from flask import Flask, render_template, request, jsonify
from manager import route_task
from agents.memory_agent import save_memory, load_memory, get_sessions

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/sessions", methods=["GET"])
def fetch_sessions():
    sessions = get_sessions()
    return jsonify({"sessions": sessions})


@app.route("/api/history/<session_id>", methods=["GET"])
def get_history(session_id):
    history = load_memory(session_id)
    if not history:
        # Still return 200 with empty list — frontend handles this gracefully
        # But log a note if the session doesn't exist at all
        sessions = get_sessions()
        session_ids = [s["id"] for s in sessions]
        if session_id not in session_ids:
            return jsonify({"error": "Session not found", "history": []}), 404
    return jsonify({"history": history})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request body"}), 400

    user_input = data.get("message", "")
    session_id = data.get("session_id", None)

    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Load history specific to this session
        history = load_memory(session_id)

        print(f"\n[Web Request] User: {user_input} (Session: {session_id})")
        response = route_task(user_input, history=history)
        print(f"\n[Web Response] Agent: {response}")

        # Save to persistent memory file, which returns the session_id
        updated_session_id = save_memory(user_input, response, session_id)

        return jsonify({"response": response, "session_id": updated_session_id})

    except Exception as e:
        import traceback
        import sys

        print(f"\n[Error] {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # debug=False for security — the Werkzeug debugger allows arbitrary code execution
    # Set DEBUG=1 or True environment variable to enable during development
    debug_mode = str(os.environ.get("DEBUG", "0")).lower() in ["1", "true", "yes"]
    if debug_mode:
        print("[WARNING] Running in debug mode — do NOT expose to network!")
    app.run(debug=debug_mode, port=5000)
