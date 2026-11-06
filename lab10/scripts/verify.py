#!/usr/bin/env python3
"""DORA есебі репозиторийдің қазіргі GitHub деректерімен сәйкес екенін тексереді."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import collect_dora as dora

LAB = dora.LAB
REPO = dora.REPO
OUT = dora.OUT


def fail(message: str) -> None:
    raise SystemExit(f"ТЕКСЕРУ СӘТСІЗ: {message}")


def main() -> None:
    metrics_path = OUT / "metrics.json"
    if not metrics_path.exists():
        fail("output/metrics.json жоқ. Алдымен collect_dora.py")
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))

    owner, repo, token = dora.repo_coords()
    live_repo = dora.api_get(f"https://api.github.com/repos/{owner}/{repo}", token)
    live_commits = dora.paginate(
        f"https://api.github.com/repos/{owner}/{repo}/commits?sha={live_repo['default_branch']}",
        token,
    )
    live_deploys = dora.paginate(f"https://api.github.com/repos/{owner}/{repo}/deployments", token)
    live_pulls = dora.paginate(
        f"https://api.github.com/repos/{owner}/{repo}/pulls?state=all", token
    )
    if metrics["sources"]["github_commits"] != len(live_commits):
        fail(
            f"коммит саны ескірген: есеп {metrics['sources']['github_commits']}, "
            f"GitHub {len(live_commits)}"
        )
    if metrics["sources"]["deployment_records"] != len(live_deploys):
        fail("deployment саны GitHub-пен сәйкес емес")
    if metrics["sources"]["pull_requests"] != len(live_pulls):
        fail("pull request саны GitHub-пен сәйкес емес")
    if metrics["repository"] != f"{owner}/{repo}":
        fail("репозиторий аты сәйкес емес")

    df = metrics["deployment_frequency"]
    if df["production_deployments"] == 0 and df["level"] == "Elite":
        fail("0 деплойды Elite деп жазуға болмайды")
    if df["production_deployments"] == 0 and df["level"] != "Low":
        fail(f"0 прод деплойдың деңгейі Low болуы керек, қазір {df['level']}")
    cfr = metrics["change_failure_rate"]
    if df["production_deployments"] == 0 and cfr["ratio"] is not None:
        fail("деплой жоқ кезде сәтсіздік үлесін 0% қылуға болмайды")
    if df["production_deployments"] == 0 and cfr["level"] != "дерек жеткіліксіз":
        fail("CFR дерексіз деңгей алды")
    if metrics["time_to_restore"]["median_hours"] is not None and metrics["time_to_restore"]["sample_count"] == 0:
        fail("MTTR үлгісіз толтырылған")

    for key in ("deployment_frequency", "lead_time", "change_failure_rate", "time_to_restore"):
        items = metrics["improvements"][key]
        if len(items) != 2:
            fail(f"{key} үшін екі жақсарту керек")
        for item in items:
            if not item.get("expected_effect"):
                fail(f"{key} жақсартуында күтілетін әсер жоқ")

    report = (OUT / "dora-report.md").read_text(encoding="utf-8")
    if str(df["production_deployments"]) not in report:
        fail("есеп мәтіні метрикамен сәйкес емес")
    for name in ("activity_weekly.png", "levels.png", "lead_time_bound.png"):
        chart = OUT / "charts" / name
        if not chart.exists() or chart.stat().st_size < 1000:
            fail(f"график жоқ немесе бос: {name}")

    workflow = (REPO / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    for needle in ("pnpm lint", "pnpm test", "pnpm build", "osv-scanner", "trivy-action", "upload-artifact"):
        if needle not in workflow:
            fail(f"құбыржолда {needle} жоқ")

    plan = (LAB / "release" / "release-plan.md").read_text(encoding="utf-8")
    rollback = (LAB / "release" / "rollback-checklist.md").read_text(encoding="utf-8")
    for needle in ("15:30", "Назгүл", "Элеонора", "Нұрбиби", "терезе"):
        if needle not in plan:
            fail(f"релиз жоспарында {needle} жоқ")
    for needle in ("- [ ]", "SHA", "smoke", "SQLite"):
        if needle not in rollback:
            fail(f"кері қайтару парағында {needle} жоқ")

    print(
        "ТЕКСЕРУ ӨТТІ: "
        f"{len(live_commits)} коммит, {len(live_deploys)} deployment, "
        f"DF={df['level']}, CFR={cfr['level']}"
    )


if __name__ == "__main__":
    main()
