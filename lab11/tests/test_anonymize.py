import json
from pathlib import Path

from quality.anonymize import anonymize

RAW = json.loads((Path(__file__).resolve().parents[1] / "data" / "guests.raw.json").read_text())


def test_masks_phone_and_drops_secrets():
    guest = anonymize(RAW[0])
    assert guest["phone"] == "+7********11"
    assert "iin" not in guest
    assert "card" not in guest
    assert "000000000000" not in json.dumps(guest)
    assert "4400000000000000" not in json.dumps(guest)


def test_email_name_and_street_are_not_recoverable():
    guest = anonymize(RAW[0])
    blob = json.dumps(guest, ensure_ascii=False)
    assert guest["email"].endswith("@example.test")
    assert "aigul.synak" not in guest["email"]
    assert "Айгүл" not in blob
    assert "Сынаққызы" not in blob
    assert "Абай" not in blob
    assert guest["address"] == "Алматы"
    assert guest["note"] == "synthetic-uat"


def test_same_input_is_stable():
    assert anonymize(RAW[0]) == anonymize(RAW[0])
