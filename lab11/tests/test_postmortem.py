import json
import re
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
POSTMORTEM = json.loads((LAB / "data" / "postmortem.json").read_text(encoding="utf-8"))
BACKLOG = json.loads((LAB / "data" / "backlog.json").read_text(encoding="utf-8"))
NARRATIVE = (LAB / "docs" / "postmortem.md").read_text(encoding="utf-8")

BLAME = re.compile(
    r"адам қатесі|human error|виноват|ұмытып кет|"
    r"кінәлі\s+(Назгүл|Элеонора|Нұрбиби|Бейсенбек|Естемес|Жаукарбекова)"
)


def test_three_actions_have_owners_and_dates():
    actions = POSTMORTEM["actions"]
    assert len(actions) == 3
    owners = {item["owner"] for item in actions}
    assert owners == {
        "Бейсенбек Нұрбиби",
        "Жаукарбекова Элеонора",
        "Естемес Назгүл",
    }
    assert all(item["dueOn"] for item in actions)


def test_actions_are_in_the_backlog_and_the_narrative():
    backlog_ids = {item["id"] for item in BACKLOG["items"]}
    for action in POSTMORTEM["actions"]:
        assert action["id"] in backlog_ids
        assert action["id"] in NARRATIVE
        assert action["owner"] in NARRATIVE
        assert action["dueOn"] in NARRATIVE


def test_narrative_does_not_assign_blame():
    assert POSTMORTEM["blameless"] is True
    assert BLAME.search(NARRATIVE) is None
    assert "кінәлі адам жоқ" in NARRATIVE
    for heading in ("Хронология", "Ықпал", "Фактор", "Не жұмыс істеді", "Әрекет"):
        assert heading in NARRATIVE
