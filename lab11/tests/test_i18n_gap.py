import json
from pathlib import Path

from quality.i18n_gap import missing_core

REPO = Path(__file__).resolve().parents[2]
LAB = Path(__file__).resolve().parents[1]


def test_recorded_gap_matches_message_files():
    tracker = json.loads((LAB / "data" / "defects.json").read_text(encoding="utf-8"))
    defect = next(item for item in tracker["items"] if item["id"] == "DEF-11-02")
    actual = missing_core(REPO / "messages", tuple(defect["prefixes"]))
    assert actual["ru"] == defect["missingKeys"]
    assert actual["en"] == defect["missingKeys"]
    assert defect["status"] == "Open"
