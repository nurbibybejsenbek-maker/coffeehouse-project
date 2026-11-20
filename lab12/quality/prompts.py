"""Промпт құрастыру. Модельге тек тіл, жұлдыз және мәтін кетеді."""

from __future__ import annotations

import json
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
LABELS = ("publish", "hold", "reject")


def user_payload(example: dict) -> str:
    return (
        f"language: {example['language']}\n"
        f"rating: {example['rating']}\n"
        f"comment: {example['comment']}"
    )


def load_prompt(version: str) -> str:
    return (LAB / "prompts" / f"{version}.txt").read_text(encoding="utf-8").strip()


def fewshot() -> list[dict]:
    return json.loads((LAB / "prompts" / "fewshot.json").read_text(encoding="utf-8"))


def messages_for(example: dict, version: str) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": load_prompt(version)}]
    if version == "v2":
        for shot in fewshot():
            messages.append({"role": "user", "content": user_payload(shot)})
            messages.append(
                {
                    "role": "assistant",
                    "content": json.dumps(
                        {"action": shot["action"], "reason": shot["reason"]},
                        ensure_ascii=False,
                    ),
                }
            )
    messages.append({"role": "user", "content": user_payload(example)})
    return messages


def parse_action(raw: str) -> str | None:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            return None
        try:
            obj = json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    if not isinstance(obj, dict):
        return None
    action = str(obj.get("action", "")).strip().lower()
    if action not in LABELS:
        return None
    return action
