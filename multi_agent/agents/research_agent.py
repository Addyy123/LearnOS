from ai_helper import ask_ai, ask_ai_with_history


def run(task, history=None):

    system_prompt = "You are an expert researcher. Find accurate, detailed information. Be helpful and remember context from the conversation."

    if history:
        return ask_ai_with_history(system_prompt, history, task)

    return ask_ai(f"{system_prompt}\n\nTask:\n{task}")
