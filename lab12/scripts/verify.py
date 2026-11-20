#!/usr/bin/env python3
"""12-апта артефактісі өз нәтижесімен қайта есептелетінін тексереді."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(LAB))

from quality.cost import (  # noqa: E402
    break_even_requests,
    gpu_month_usd,
    request_cost_usd,
    review_volume,
)
from quality.decide import suggestion_pilot  # noqa: E402
from scripts.score import score_version  # noqa: E402

REQUIRED = [
    "data/eval-set.json",
    "data/acceptance.json",
    "data/tariffs.json",
    "prompts/v1.txt",
    "prompts/v2.txt",
    "prompts/fewshot.json",
    "docs/function-card.md",
    "docs/cost.md",
    "docs/adr/0001-review-moderation-pilot.md",
    "output/raw-v1.jsonl",
    "output/raw-v2.jsonl",
    "output/eval-results.json",
    "output/cost.json",
]


def main() -> int:
    missing = [path for path in REQUIRED if not (LAB / path).is_file()]
    if missing:
        print("Жоқ файлдар:")
        for path in missing:
            print(f"  {path}")
        return 1

    gold_path = LAB / "data" / "eval-set.json"
    gold_bytes = gold_path.read_bytes()
    gold = json.loads(gold_bytes)
    bars = json.loads((LAB / "data" / "acceptance.json").read_text(encoding="utf-8"))
    recorded = json.loads((LAB / "output" / "eval-results.json").read_text(encoding="utf-8"))
    if recorded["eval_set_sha256"] != hashlib.sha256(gold_bytes).hexdigest():
        print("eval-results басқа жиынтыққа тиесілі")
        return 1
    if len(gold["examples"]) < 30:
        print("Эталон 30-дан аз")
        return 1

    for version in ("v1", "v2"):
        fresh = score_version(version, gold["examples"], bars["labels"])
        saved = recorded["versions"][version]
        if abs(fresh["macro_f1"] - saved["macro_f1"]) > 1e-12:
            print(f"{version} macro-F1 қайта есептелгенде сәйкеспейді")
            return 1
        if fresh["correct"] != saved["correct"]:
            print(f"{version} дұрыс саны сәйкеспейді")
            return 1
        if suggestion_pilot(fresh, bars) != saved["suggestion_pilot"]:
            print(f"{version} пилот шешімі сәйкеспейді")
            return 1

    tariffs = json.loads((LAB / "data" / "tariffs.json").read_text(encoding="utf-8"))
    cost = json.loads((LAB / "output" / "cost.json").read_text(encoding="utf-8"))
    candidate = recorded["versions"]["v2"]
    price = tariffs["commercial"]
    secure = gpu_month_usd(tariffs["gpu"]["secure_usd_per_hour"], tariffs["hours_per_month"])
    per_request = request_cost_usd(
        candidate["mean_input_tokens"],
        candidate["mean_output_tokens"],
        price["input_per_mtok"],
        price["output_per_mtok"],
    )
    expected_break = break_even_requests(secure, per_request)
    saved_break = cost["gpt_4_1_mini"]["base"]["break_even_requests"]
    if abs(expected_break - saved_break) > 1e-6:
        print("Теңесу нүктесі қайта есептелгенде сәйкеспейді")
        return 1
    base_reviews = review_volume(tariffs["orders_month_12"], tariffs["review_rate"])
    if abs(cost["volume"]["base_reviews"] - base_reviews) > 1e-9:
        print("Айлық көлем сәйкеспейді")
        return 1

    pilot = recorded["versions"]["v2"]["suggestion_pilot"]
    adr = (LAB / "docs" / "adr" / "0001-review-moderation-pilot.md").read_text(encoding="utf-8")
    expected = "Шешім: пилотты ашамыз" if pilot else "Шешім: пилотты ашпаймыз"
    if expected not in adr:
        print(f"ADR өлшем шешімін қайталамайды: {expected}")
        return 1
    if "Автоматты жариялау жоқ" not in adr:
        print("ADR автоматты жариялауды жаппаған")
        return 1
    cost_doc = (LAB / "docs" / "cost.md").read_text(encoding="utf-8")
    if f"{expected_break:.0f}" not in cost_doc:
        print("Құн құжатында теңесу нүктесі жоқ")
        return 1
    if "https://developers.openai.com/api/docs/pricing" not in cost_doc:
        print("OpenAI прайсы сілтенбеген")
        return 1
    if "https://www.runpod.io/pricing" not in cost_doc:
        print("RunPod прайсы сілтенбеген")
        return 1

    print(f"Пилот: {expected}")
    print(f"v2 macro-F1: {recorded['versions']['v2']['macro_f1']:.3f}")
    print("12-апта артефактісі өз есебімен сәйкес")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
