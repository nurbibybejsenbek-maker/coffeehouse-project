import json

from pm_assistant.check import check_draft
from pm_assistant.facts import ROOT, assert_no_secrets, build_facts, public_remote, render_brief


def _no_network(slug, token, start, end):
    return {"ok": False, "status": None, "count": None, "error": "тест желіге шықпады"}


def test_remote_strips_token():
    cleaned = public_remote("https://ghp_exampletoken@github.com/owner/coffeehouse-project.git")
    assert cleaned == "https://github.com/owner/coffeehouse-project.git"
    assert "ghp_" not in cleaned


def test_secret_scanner_rejects_token():
    try:
        assert_no_secrets("token ghp_abcdefghijklmnopqrstuvwxyz012345")
    except RuntimeError:
        return
    raise AssertionError("құпия өткен")


def test_two_sprints_match_metrics():
    facts = build_facts(ROOT, github_fetcher=_no_network)
    blob = json.dumps(facts, ensure_ascii=False)
    assert "ghp_" not in blob
    first, second = facts["sprints"]
    assert first["throughput"] == "9"
    assert second["throughput"] == "11"
    assert first["done_count"] == "9"
    assert [item["id"] for item in first["open"]] == ["CH-104", "CH-108", "CH-111"]
    assert [item["id"] for item in second["open"]] == ["CH-209"]
    assert second["open"][0]["aged"] is False
    assert first["open"][0]["aged"] is True
    assert facts["repository"]["windows"][0]["local_git_commits"] == 0
    assert facts["repository"]["windows"][1]["local_git_commits"] == 0
    assert facts["retro_action"]["achieved"] is True
    assert facts["next_action"]["due"] == "дерек жоқ"
    brief = render_brief(facts)
    assert "CH-209" in brief
    assert "Оларды аяқталмады деп жазба." in brief
    assert "0 коммит" in brief or "коммиті: 0" in brief


def test_checker_flags_invented_number_and_task():
    brief = "Throughput: 9\nCH-209 ашық\n"
    draft = "Throughput: 12\nCH-999 жабылды\nОл кінәлі.\n"
    flags = check_draft(brief, draft)
    assert "12" in flags["unexpected_numbers"]
    assert flags["unknown_tasks"] == ["CH-999"]
    assert flags["judgment_lines"]
