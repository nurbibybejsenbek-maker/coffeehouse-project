"""Қабылдау шешімі 8-апта SoW ережесімен: ашық S1 және S2 нөл болуы керек."""

from __future__ import annotations

from datetime import date, timedelta

BLOCKING = {"S1", "S2"}
FIX_BUSINESS_DAYS = {"S1": 1, "S2": 5}


def add_business_days(start: date, days: int) -> date:
    if days < 0:
        raise ValueError("days must be >= 0")
    current = start
    left = days
    while left:
        current += timedelta(days=1)
        if current.weekday() < 5:
            left -= 1
    return current


def is_defect(item: dict) -> bool:
    return item.get("type", "defect") == "defect"


def open_blocking(tracker: dict) -> list[dict]:
    found = []
    for item in tracker["items"]:
        if not is_defect(item):
            continue
        if item["status"] != "Open":
            continue
        if item["severity"] in BLOCKING:
            found.append(item)
    return found


def decision(tracker: dict) -> str:
    if open_blocking(tracker):
        return "rejected"
    return "accepted"


def sla_due(item: dict) -> date | None:
    if not is_defect(item):
        return None
    days = FIX_BUSINESS_DAYS.get(item["severity"])
    if days is None:
        return None
    opened = date.fromisoformat(item["openedOn"])
    return add_business_days(opened, days)
