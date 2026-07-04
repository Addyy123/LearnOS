import json
from react_engine.parser import ReActParser, ReActParserError
from ai_helper import ask_ai

REACT_SYSTEM_PROMPT = """You are an advanced AI agent equipped with external tools.

You have access to the following tools:
{tool_descriptions}

You MUST follow this exact format for EVERY step of your reasoning:
Question: the input question or task you must resolve
Thought: consider what needs to be done next based on the task and previous observations
Action: the exact name of the tool to use (must be one of: [{tool_names}])
Action Input: a valid JSON object containing the arguments for the tool
Observation: the result of the tool execution
... (this cycle can repeat N times until you solve the task)
Thought: I now know the final answer
Final Answer: the final answer to the original question or task

CRITICAL RULES:
1. NEVER hallucinate an Observation. You MUST wait for the user to provide the Observation.
2. NEVER output "Final Answer" until you have successfully executed the required tools and observed their results. If the user asks you to do something (like opening an app, writing a file, etc.), you MUST use a tool to do it before finishing.
3. Your Action Input MUST be a valid JSON object, without any markdown formatting around it.
4. If you have finished the task, or if you are simply answering a question or responding conversationally, you MUST prefix your response with "Final Answer: ". NEVER respond without either an "Action:" or a "Final Answer:".
5. If you cannot solve the task or are stuck in a loop, use "Final Answer: I am unable to solve this task because..." to exit gracefully.

Begin!
"""

# Maximum characters to keep in scratchpad per observation
MAX_OBS_LENGTH = 1500


class ReActAgent:
    def __init__(self, name: str, tools: list, max_iterations: int = 5):
        """
        tools: List of dicts e.g. [{"name": "create_file", "description": "creates a file, args: filepath(str), content(str)", "func": callable}]
        """
        self.name = name
        self.tools = {t["name"]: t for t in tools}
        self.max_iterations = max_iterations
        self.parser = ReActParser()

    def _get_tool_descriptions(self):
        desc = []
        for name, tool in self.tools.items():
            desc.append(f"- {name}: {tool['description']}")
        return "\n".join(desc)

    def _get_tool_names(self):
        return ", ".join(self.tools.keys())

    def _truncate_observation(self, obs):
        """Truncate long observations to prevent scratchpad token explosion."""
        obs_str = str(obs)
        if len(obs_str) > MAX_OBS_LENGTH:
            return obs_str[:MAX_OBS_LENGTH] + "\n... [observation truncated]"
        return obs_str

    def _build_context(self, history: list) -> str:
        if not history:
            return ""
        context = "Past Conversation History:\n"
        for h in history[-5:]:
            context += f"User: {h['user']}\nAssistant: {h['assistant']}\n"
        return context + "\n"

    def _manage_scratchpad_size(self, scratchpad: str) -> str:
        if len(scratchpad) <= 8000:
            return scratchpad
        lines = scratchpad.split("\n")
        question_line = lines[0]
        recent = scratchpad[-3000:]
        idx = recent.find("Thought:")
        if idx != -1:
            recent = recent[idx:]
        return f"{question_line}\n... [earlier steps truncated]\n{recent}"

    def _execute_action(self, action: str, action_input: dict) -> str:
        if action not in self.tools:
            return f"Error: Tool '{action}' is not defined. Available tools: [{self._get_tool_names()}]. If you meant to finish, use 'Final Answer:' instead."
        try:
            tool_func = self.tools[action]["func"]
            return tool_func(**action_input)
        except Exception as e:
            return f"Error executing '{action}': {str(e)}"

    def run(self, task: str, history: list = None):
        print(f"\n[{self.name}] Starting ReAct loop for task: {task[:100]}...")

        system_prompt = REACT_SYSTEM_PROMPT.format(
            tool_descriptions=self._get_tool_descriptions(),
            tool_names=self._get_tool_names(),
        )
        context = self._build_context(history)
        scratchpad = f"Question: {task}\n"
        last_obs = "None"
        
        # Check if the user is granting approval in this turn
        approval_granted = False
        task_lower = task.lower().strip()
        approval_words = ["yes", "approve", "y", "proceed", "go ahead", "do it", "ok", "okay"]
        if any(task_lower == w or task_lower.startswith(w + " ") for w in approval_words) or "approve" in task_lower:
            approval_granted = True

        for iteration in range(self.max_iterations):
            scratchpad = self._manage_scratchpad_size(scratchpad)
            prompt = f"{system_prompt}\n{context}{scratchpad}"
            response = ask_ai(prompt)

            try:
                parsed = self.parser.parse(response)
            except ReActParserError as e:
                print(f"[{self.name} Parser Error] {e}")
                scratchpad += f"{response}\nObservation: Error! {e}\n"
                continue

            thought = parsed.get("thought", "")
            action = parsed.get("action")
            action_input = parsed.get("action_input", {})

            if thought:
                print(f"[{self.name} Thought] {thought[:150]}...")

            if action == "Finish":
                final_ans = action_input.get("answer", str(action_input))
                print(f"[{self.name} Final Answer] {final_ans[:150]}...")
                return final_ans

            print(f"[{self.name} Action] {action} | Args: {str(action_input)[:200]}")

            # HITL Permission Check
            if action in self.tools and self.tools[action].get("requires_approval", False) and not approval_granted:
                perm_msg = f"🚨 **Permission Required:** I need to use the `{action}` tool with arguments:\n```json\n{json.dumps(action_input, indent=2)}\n```\n\nDo you approve? Reply 'approve' to proceed."
                print(f"[{self.name} HITL Interrupt] {perm_msg[:100]}...")
                return perm_msg

            obs = self._execute_action(action, action_input)
            obs_truncated = self._truncate_observation(obs)
            print(f"[{self.name} Observation] {obs_truncated[:200]}...")
            last_obs = obs_truncated

            scratchpad += f"Thought: {thought}\nAction: {action}\nAction Input: {json.dumps(action_input)}\nObservation: {obs_truncated}\n"

        error_msg = f"Agent '{self.name}' stopped after {self.max_iterations} iterations without calling 'Final Answer:'. Last observation: {last_obs}"
        print(f"[{self.name} Error] {error_msg[:200]}...")
        return error_msg
