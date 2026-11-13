import json
from datetime import date
from pathlib import Path

from quality.acceptance import add_business_days, decision, open_blocking, sla_due

ROOT = Path(__file__).resolve().parents[1]
TRACKER = json.loads((ROOT / "data" / "defects.json").read_text(encoding="utf-8"))


def test_friday_plus_five_business_days_is_next_friday():
    assert add_business_days(date(2026, 11, 13), 5) == date(2026, 11, 20)


def test_open_s2_rejects_acceptance():
    assert decision(TRACKER) == "rejected"
    blocking = {item["id"] for item in open_blocking(TRACKER)}
    assert blocking == {"DEF-11-01", "DEF-11-02"}


def test_change_request_and_s3_do_not_block():
    blocking_ids = {item["id"] for item in open_blocking(TRACKER)}
    assert "CR-11-01" not in blocking_ids
    assert "DEF-11-03" not in blocking_ids


def test_s2_due_dates_follow_sla():
    by_id = {item["id"]: item for item in TRACKER["items"]}
    for defect_id in ("DEF-11-01", "DEF-11-02"):
        due = sla_due(by_id[defect_id])
        assert due == date(2026, 11, 20)
        assert by_id[defect_id]["dueOn"] == due.isoformat()
    assert sla_due(by_id["DEF-11-03"]) is None
    assert sla_due(by_id["CR-11-01"]) is None


def test_priority_is_separate_from_severity():
    by_id = {item["id"]: item for item in TRACKER["items"]}
    assert by_id["DEF-11-01"]["severity"] == "S2"
    assert by_id["DEF-11-01"]["priority"] == "High"
    assert by_id["DEF-11-03"]["severity"] == "S3"
    assert by_id["DEF-11-03"]["priority"] == "Medium"
