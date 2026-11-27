"""Нобайдағы сан мен тапсырма id BRIEF-те бар ма. Бұл адам тексеруін алмастырмайды."""

from __future__ import annotations

import re

NUMBER = re.compile(r"\d+(?:[.,]\d+)?")
TASK = re.compile(r"CH-\d+")
JUDGMENT = re.compile(r"кінәлі|жалқау|нашар|жақсы істемеді|шамамен|ықтимал|мүмкін|шамасы", re.I)


def _numbers(text: str) -> set[str]:
    return {token.replace(",", ".") for token in NUMBER.findall(text)}


def unexpected_numbers(brief: str, draft: str) -> list[str]:
    allowed = _numbers(brief)
    flagged = []
    seen = set()
    for token in NUMBER.findall(draft):
        key = token.replace(",", ".")
        if key in allowed or key in seen:
            continue
        seen.add(key)
        flagged.append(token)
    return flagged


def unknown_tasks(brief: str, draft: str) -> list[str]:
    allowed = set(TASK.findall(brief))
    return sorted(set(TASK.findall(draft)) - allowed)


def judgment_lines(draft: str) -> list[str]:
    return [line.strip() for line in draft.splitlines() if JUDGMENT.search(line)]


def check_draft(brief: str, draft: str) -> dict:
    return {
        "unexpected_numbers": unexpected_numbers(brief, draft),
        "unknown_tasks": unknown_tasks(brief, draft),
        "judgment_lines": judgment_lines(draft),
    }
