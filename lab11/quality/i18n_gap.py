"""kk / ru / en хабарлама кілттерін салыстыру."""

from __future__ import annotations

import json
from pathlib import Path

LOCALES = ("kk", "ru", "en")
CORE_PREFIXES = ("order.", "reservation.")


def flatten(obj: object, prefix: str = "") -> set[str]:
    keys: set[str] = set()
    if isinstance(obj, dict):
        for key, value in obj.items():
            path = f"{prefix}.{key}" if prefix else key
            keys |= flatten(value, path)
    else:
        keys.add(prefix)
    return keys


def load_locales(messages_dir: Path) -> dict[str, set[str]]:
    loaded: dict[str, set[str]] = {}
    for locale in LOCALES:
        data = json.loads((messages_dir / f"{locale}.json").read_text(encoding="utf-8"))
        loaded[locale] = flatten(data)
    return loaded


def missing_core(messages_dir: Path, prefixes: tuple[str, ...] = CORE_PREFIXES) -> dict[str, list[str]]:
    locales = load_locales(messages_dir)
    source = {key for key in locales["kk"] if key.startswith(prefixes)}
    report: dict[str, list[str]] = {}
    for locale in ("ru", "en"):
        report[locale] = sorted(key for key in source if key not in locales[locale])
    return report
