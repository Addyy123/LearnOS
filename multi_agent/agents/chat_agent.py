import datetime
from ai_helper import ask_ai_with_history


def run(task, history=None):
    """Chat agent - handles casual conversation, greetings, and simple questions."""

    now = datetime.datetime.now()
    date_str = now.strftime("%A, %B %d, %Y")
    time_str = now.strftime("%I:%M %p")

    system_prompt = f"""You are a friendly and adaptable AI assistant.
You are helpful, conversational, and remember everything the user tells you.
The current date is {date_str} and the current time is {time_str}.
Keep your responses short and natural — like a real conversation.
If the user tells you their name, remember it.
If the user tells you what your name should be (e.g. "your name is Alexa"), you must fully adopt that name and use it from then on.
By default, you can introduce yourself simply as their AI assistant, unless they have assigned you a specific name.
Don't over-explain or give long research-style answers for simple questions."""

    if history:
        return ask_ai_with_history(system_prompt, history, task)

    from ai_helper import ask_ai

    return ask_ai(f"{system_prompt}\n\nUser: {task}")
