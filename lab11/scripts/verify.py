#!/usr/bin/env python3
"""11-апта артефактілерінің тұтастығын тексереді."""

from __future__ import annotations

import json
import sys
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(LAB))

from quality.acceptance import decision  # noqa: E402

REQUIRED = [
    "docs/test-plan.md",
    "docs/uat-protocol.md",
    "docs/postmortem.md",
    "docs/runbook.md",
    "data/defects.json",
    "data/backlog.json",
    "data/postmortem.json",
    "data/uat-scenarios.json",
    "monitoring/docker-compose.yml",
    "monitoring/monitors.json",
    "load/menu-read.js",
    "load/order-write.js",
    "e2e/playwright.config.ts",
    "bruno/coffeehouse/bruno.json",
]


def main() -> int:
    missing = [path for path in REQUIRED if not (LAB / path).is_file()]
    if missing:
        print("Жоқ файлдар:")
        for path in missing:
            print(f"  {path}")
        return 1

    tracker = json.loads((LAB / "data" / "defects.json").read_text(encoding="utf-8"))
    monitors = json.loads((LAB / "monitoring" / "monitors.json").read_text(encoding="utf-8"))
    compose = (LAB / "monitoring" / "docker-compose.yml").read_text(encoding="utf-8")
    runbook = (LAB / "docs" / "runbook.md").read_text(encoding="utf-8")
    plan = (LAB / "docs" / "test-plan.md").read_text(encoding="utf-8")

    urls = {probe["url"] for probe in monitors["probes"]}
    if not any(url.endswith("/api/menu") for url in urls):
        print("Uptime Kuma зондтарында GET /api/menu жоқ")
        return 1
    if "louislam/uptime-kuma:1" not in compose:
        print("docker-compose Uptime Kuma бейнесін көтермейді")
        return 1
    if "RB-ORDER-5XX" not in runbook:
        print("Runbook сценарийі табылмады")
        return 1
    for tool in ("pytest", "Playwright", "k6", "Bruno", "Uptime Kuma"):
        if tool not in plan:
            print(f"Тестілеу жоспарында құрал жоқ: {tool}")
            return 1

    print(f"Қабылдау шешімі: {decision(tracker)}")
    print(f"Зондтар: {len(monitors['probes'])}")
    print("11-апта артефактілері толық")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
