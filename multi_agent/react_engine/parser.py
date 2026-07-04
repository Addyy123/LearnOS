import re
import json


class ReActParserError(Exception):
    pass


class ReActParser:
    @staticmethod
    def parse(text: str):
        # Extract Thought (optional but expected)
        thought_match = re.search(
            r"Thought:\s*(.*?)(?=Action:|Final Answer:|$)",
            text,
            re.DOTALL | re.IGNORECASE,
        )
        thought = thought_match.group(1).strip() if thought_match else ""

        # Extract Action and Action Input first
        # Use a non-greedy match that stops at newline (without DOTALL, so '.' doesn't match '\n')
        action_match = re.search(
            r"Action:\s*(.+?)(?:\s*$|\s*\n)", text, re.IGNORECASE | re.MULTILINE
        )
        action_input_match = re.search(
            r"Action Input:\s*(.*?)(?=Observation:|Final Answer:|$)",
            text,
            re.DOTALL | re.IGNORECASE,
        )

        if (
            action_match
            and action_match.group(1).strip().lower() != "none"
            and action_match.group(1).strip() != ""
        ):
            action = action_match.group(1).strip().strip("`").strip()
            action_input_raw = (
                action_input_match.group(1).strip() if action_input_match else "{}"
            )

            # More robust JSON extraction: find the first { and last }
            start_idx = action_input_raw.find("{")
            end_idx = action_input_raw.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                action_input_raw = action_input_raw[start_idx : end_idx + 1]
            else:
                action_input_raw = "{}"

            try:
                action_input = json.loads(action_input_raw)
            except json.JSONDecodeError as e:
                raise ReActParserError(
                    f"Could not parse 'Action Input' as valid JSON. Provide only raw JSON without any extra text. Error: {e}"
                )

            return {"thought": thought, "action": action, "action_input": action_input}

        # Check for Final Answer only if no Action is found
        final_ans_match = re.search(
            r"Final Answer:\s*(.*)", text, re.DOTALL | re.IGNORECASE
        )
        if final_ans_match:
            return {
                "thought": thought,
                "action": "Finish",
                "action_input": {"answer": final_ans_match.group(1).strip()},
            }

        raise ReActParserError(
            "Could not find 'Action:' or 'Final Answer:'. Please strictly use the format 'Action: <tool_name>' followed by 'Action Input: <json_args>'. If finished, use 'Final Answer: <answer>'."
        )
