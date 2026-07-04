from manager import route_task
from agents.memory_agent import save_memory, load_memory, get_sessions

print("Multi-Agent System Started")
print("Type 'exit' to quit")

# Try to resume the most recent session, or start a new one
current_session_id = None
sessions = get_sessions()
if sessions:
    current_session_id = sessions[0]["id"]
    print(f"[Resuming session: {sessions[0]['title']}]")

# Load past conversation history for the current session
conversation_history = load_memory(current_session_id)
if conversation_history:
    print(f"[Memory loaded: {len(conversation_history)} past interactions]")

try:
    while True:

        user_input = input("\nYou: ")

        if user_input.lower() == "exit":
            break

        try:
            response = route_task(user_input, history=conversation_history)
            print("\nAgent:", response)

            # Save to persistent memory file and capture the session_id
            current_session_id = save_memory(user_input, response, current_session_id)

            # Update local conversation history for current session context
            conversation_history.append({"user": user_input, "assistant": response})

        except RuntimeError as e:
            print(f"\n[AI Error] {e}")
            print("Check your API key in config.py.")

        except Exception as e:
            print(f"\n[Error] {e}")
            print("Please try again.")

except KeyboardInterrupt:
    print("\n\n[Exiting gracefully... Goodbye!]")
