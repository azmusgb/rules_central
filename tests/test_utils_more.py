import utils


def test_flatten_rules_hierarchy():
    data = [
        {
            "RuleGUID": "root",
            "Children": [{"RuleGUID": "child"}],
            "Actions": [
                {"ActionName": "do", "ChildRules": [{"RuleGUID": "action_child"}]}
            ],
        }
    ]
    flat = utils.flatten_rules(data)
    assert len(flat) == 3
    by_guid = {r["RuleGUID"]: r for r in flat}
    assert by_guid["child"]["ParentGUID"] == "root"
    assert by_guid["child"]["ParentActionIndex"] is None
    assert by_guid["action_child"]["ParentGUID"] == "root"
    assert by_guid["action_child"]["ParentActionIndex"] == 0


def test_build_edge_map():
    edges = [
        {"edge_str": "A --> B", "edge_type": "PC"},
        {"edge_str": "B -->|label| C", "edge_type": "PC"},
    ]
    edge_map = utils.build_edge_map(edges)
    assert edge_map == {"A": ["B"], "B": ["C"]}


def test_propagate_disabled_rules():
    rules = [
        {
            "RuleGUID": "root",
            "Attributes": {"_Disabled": "1"},
            "Children": [{"RuleGUID": "child", "Attributes": {}}],
        }
    ]
    utils.propagate_disabled_rules(rules)
    assert rules[0]["Attributes"]["_Disabled"] == "1"
    assert rules[0]["Children"][0]["Attributes"]["_Disabled"] == "1"


def test_validate_and_build_hierarchy():
    input_data = [
        {"_RuleGUID": "r1", "_RuleName": "Root"},
        {"_RuleGUID": "c1", "ParentGUID": "r1", "_RuleName": "Child"},
    ]
    normalized, guid_map = utils.validate_hierarchy_data(input_data)
    roots = utils.build_hierarchy(normalized, guid_map)
    assert len(roots) == 1
    root = roots[0]
    assert root["RuleGUID"] == "r1"
    assert root["RuleName"] == "Root"
    assert root.get("children")
    child = root["children"][0]
    assert child["RuleGUID"] == "c1"
    assert child["RuleName"] == "Child"
