"""Тестілік деректен жеке деректерді алу.

Демо-стенд пен UAT жазбасына нақты қонақ, карта және ЖСН түспейді.
Маска тұрақты: бір кіріс әрқашан бір шығыс береді, бірақ бастапқы
телефон, пошта және көше қайта жиналмайды.
"""

from __future__ import annotations

import hashlib
import re

CITIES = ("Алматы", "Астана", "Шымкент")
DROP_KEYS = {
    "password",
    "passwordhash",
    "card",
    "pan",
    "cvv",
    "token",
    "iin",
    "nationalid",
}
NAME_KEYS = {"firstname", "first_name", "lastname", "last_name", "name"}


def anonymize(record: dict, *, salt: str = "coffeehouse-uat") -> dict:
    cleaned: dict = {}
    for key, value in record.items():
        normalized = re.sub(r"[^a-z]", "", key.lower())
        if normalized in DROP_KEYS or normalized.endswith("token"):
            continue
        if normalized in {"phone", "tel"}:
            cleaned[key] = mask_phone(str(value))
        elif normalized == "email":
            cleaned[key] = mask_email(str(value), salt)
        elif normalized in NAME_KEYS:
            cleaned[key] = "Қонақ"
        elif normalized == "address":
            cleaned[key] = city_only(str(value))
        else:
            cleaned[key] = value
    return cleaned


def mask_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 4:
        return "REDACTED"
    hidden = "*" * (len(digits) - 3)
    return f"+{digits[0]}{hidden}{digits[-2:]}"


def mask_email(email: str, salt: str) -> str:
    local = email.split("@", 1)[0]
    digest = hashlib.sha256(f"{salt}:{local}".encode()).hexdigest()[:8]
    return f"guest-{digest}@example.test"


def city_only(address: str) -> str:
    for city in CITIES:
        if city in address:
            return city
    return "Қала көрсетілмеген"
