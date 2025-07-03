"""
Service for processing and retrieving rule statistics.
"""
class RuleProcessingService:
    def __init__(self):
        pass

    def get_status_counts(self) -> dict:
        """
        Return a dict with counts of rules by status.
        Keys: 'active', 'draft', 'deprecated'
        """
        # TODO: implement real logic
        return {'active': 0, 'draft': 0, 'deprecated': 0}

    def build_hierarchy(self, rules: list) -> list:
        """Construct a normalized hierarchy from a list of rule dictionaries."""
        import json

        def _clean_quotes(s):
            if isinstance(s, str):
                if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
                    return s[1:-1]
            return s

        if not isinstance(rules, list):
            raise ValueError("Input data must be a list of rule objects")

        result = []
        stack = []

        for rule in rules:
            # Clean up quoted fields for proper rendering
            for field in ["_RuleName", "_FunctionName", "_RuleGUID", "AttrName", "UDFName", "Value", "SelectionListName", "Table"]:
                if field in rule and isinstance(rule[field], str):
                    rule[field] = _clean_quotes(rule[field])

            # Add fallback RuleGUID if missing
            if not rule.get("_RuleGUID"):
                import uuid
                rule["_RuleGUID"] = str(uuid.uuid4())

            # Fix _ActionNames if it's a stringified JSON object
            if "_ActionNames" in rule and isinstance(rule["_ActionNames"], str):
                try:
                    rule["_ActionNames"] = json.loads(_clean_quotes(rule["_ActionNames"]))
                except Exception:
                    pass  # leave as-is if malformed

            # Fix _ActionMap if it's a stringified list in braces
            if "_ActionMap" in rule and isinstance(rule["_ActionMap"], str):
                cleaned = _clean_quotes(rule["_ActionMap"])
                try:
                    rule["_ActionMap"] = [int(x.strip()) for x in cleaned.strip("{}").split(",") if x.strip().isdigit()]
                except Exception:
                    pass

            # Sync cleaned name to RuleName used by viewer and also update _RuleName for consistency
            cleaned_name = rule.get("_RuleName", "")
            rule["_RuleName"] = cleaned_name
            rule["RuleName"] = cleaned_name
            level = int(rule.get("HierarchyLevel", 0))
            rule["_children"] = []

            while stack and int(stack[-1].get("HierarchyLevel", 0)) >= level:
                stack.pop()

            if stack:
                stack[-1]["_children"].append(rule)
            else:
                result.append(rule)

            stack.append(rule)

        return result
