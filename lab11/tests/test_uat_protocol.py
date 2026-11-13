import json
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
SCENARIOS = json.loads((LAB / "data" / "uat-scenarios.json").read_text(encoding="utf-8"))
PROTOCOL = (LAB / "docs" / "uat-protocol.md").read_text(encoding="utf-8")

RESULT_WORD = {
    "Pass": "Өтті",
    "Fail": "Өтпеді",
    "Partial": "Ескертумен",
}


def test_at_least_eight_scenarios_have_pass_criteria():
    assert len(SCENARIOS["scenarios"]) >= 8
    for scenario in SCENARIOS["scenarios"]:
        assert scenario["passCriteria"]
        assert scenario["result"] in RESULT_WORD
        heading = f"### {scenario['id']}"
        assert heading in PROTOCOL
        block = PROTOCOL.split(heading, 1)[1][:600]
        assert "Өту өлшемі" in block
        assert RESULT_WORD[scenario["result"]] in block


def test_protocol_records_the_rejection():
    assert "Қабылданбады" in PROTOCOL
    assert "CR-11-01" in PROTOCOL
    assert "DEF-11-01" in PROTOCOL
    assert "DEF-11-02" in PROTOCOL
