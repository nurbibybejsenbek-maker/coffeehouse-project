import json
from pathlib import Path

from quality.prompts import fewshot, messages_for, parse_action

LAB = Path(__file__).resolve().parents[1]


def load():
    return json.loads((LAB / "data" / "eval-set.json").read_text(encoding="utf-8"))


def test_gold_set_has_thirty_balanced_examples():
    examples = load()["examples"]
    assert len(examples) >= 30
    counts = {}
    languages = {}
    for item in examples:
        counts[item["gold_action"]] = counts.get(item["gold_action"], 0) + 1
        languages[item["language"]] = languages.get(item["language"], 0) + 1
    assert counts == {"publish": 12, "hold": 12, "reject": 12}
    assert languages == {"kk": 12, "ru": 12, "en": 12}
    assert len({item["comment"] for item in examples}) == len(examples)


def test_fewshot_is_not_inside_the_gold_set():
    comments = [item["comment"] for item in load()["examples"]]
    for shot in fewshot():
        assert all(shot["comment"] not in comment for comment in comments)


def test_prompt_does_not_send_the_gold_label():
    example = next(item for item in load()["examples"] if item["gold_action"] == "hold")
    messages = messages_for(example, "v2")
    last = messages[-1]["content"]
    assert messages[-1]["role"] == "user"
    assert "gold_action" not in last
    assert example["gold_action"] not in last
    assert example["comment"] in last


def test_parser_accepts_only_the_three_actions():
    assert parse_action('{"action":"hold","reason":"суық"}') == "hold"
    assert parse_action('мәтін\n{"action":"reject","reason":"спам"}') == "reject"
    assert parse_action('{"action":"maybe"}') is None
    assert parse_action("түсінбедім") is None
