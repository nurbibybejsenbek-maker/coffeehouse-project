#!/usr/bin/env python3
"""Фактіні жинап, жергілікті модельден статус нобайын сұрайды."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(LAB))

from pm_assistant.check import check_draft  # noqa: E402
from pm_assistant.facts import ROOT, build_facts, render_brief  # noqa: E402
from pm_assistant.ollama_client import DEFAULT_MODEL, chat  # noqa: E402

OUT = LAB / "output"
PROMPT = LAB / "prompts" / "status_v1.txt"


def disclosure(model: str, called_at: str) -> str:
    return "\n".join(
        [
            "Ашып көрсету. Осы есептің нобайын жергілікті модель жазды.",
            f"Құрал: Ollama, модель {model}. Шақыру: {called_at}, Asia/Almaty.",
            "Мақсаты: CoffeeHouse жобасының өткен екі спринті бойынша статус-есеп нобайы.",
            "Промпт: lab13/prompts/status_v1.txt. Фактілер: lab13/output/brief.md.",
            "Сандарды Python lab09 метрикасынан жинады. Модель автор емес және шешімнің иесі емес.",
            "Қорытынды мен дәлсіздік журналын адам жазды. Жіберілген құжат үшін жауапты адам: Бейсенбек Нұрбиби.",
            "ЖОО атауы lab09/data/project.json ішінде әлі толтырылмаған. Қолданылған жария ереже: docs/guide.md.",
            "",
        ]
    )


def write_facts(token: str | None) -> tuple[dict, str, int]:
    started = time.perf_counter()
    facts = build_facts(ROOT, github_token=token)
    brief = render_brief(facts)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    OUT.mkdir(exist_ok=True)
    (OUT / "facts.json").write_text(json.dumps(facts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "brief.md").write_text(brief, encoding="utf-8")
    return facts, brief, elapsed_ms


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--facts-only", action="store_true")
    parser.add_argument("--draft-only", action="store_true")
    parser.add_argument("--model", default=os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL))
    args = parser.parse_args()
    if args.facts_only and args.draft_only:
        print("Бір режимді таңдаңыз.", file=sys.stderr)
        return 2

    token = os.environ.get("GITHUB_TOKEN") or None
    collect_ms = None
    if args.draft_only:
        brief = (OUT / "brief.md").read_text(encoding="utf-8")
    else:
        _, brief, collect_ms = write_facts(token)
        print(f"facts {collect_ms} ms")

    if args.facts_only:
        timing_path = OUT / "timing.json"
        previous = {}
        if timing_path.exists():
            previous = json.loads(timing_path.read_text(encoding="utf-8"))
        previous["collect_ms"] = collect_ms
        timing_path.write_text(json.dumps(previous, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return 0

    system = PROMPT.read_text(encoding="utf-8")
    draft, model_ms, model_name, meta = chat(args.model, system, brief)
    called_at = datetime.now(ZoneInfo("Asia/Almaty")).isoformat(timespec="seconds")
    flags = check_draft(brief, draft)
    OUT.mkdir(exist_ok=True)
    (OUT / "draft.md").write_text(draft, encoding="utf-8")
    report = disclosure(model_name, called_at) + "\n" + draft.strip() + "\n"
    (OUT / "status-report.md").write_text(report, encoding="utf-8")
    (OUT / "auto-flags.json").write_text(json.dumps(flags, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    timing = {}
    timing_path = OUT / "timing.json"
    if timing_path.exists():
        timing = json.loads(timing_path.read_text(encoding="utf-8"))
    if collect_ms is not None:
        timing["collect_ms"] = collect_ms
    timing["model_ms"] = model_ms
    timing["model"] = model_name
    timing["called_at"] = called_at
    timing["done_reason"] = meta.get("done_reason")
    timing["eval_count"] = meta.get("eval_count")
    timing["prompt_eval_count"] = meta.get("prompt_eval_count")
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"draft {model_ms} ms {model_name}")
    print(
        "flags "
        f"numbers={len(flags['unexpected_numbers'])} "
        f"tasks={len(flags['unknown_tasks'])} "
        f"judgment={len(flags['judgment_lines'])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
