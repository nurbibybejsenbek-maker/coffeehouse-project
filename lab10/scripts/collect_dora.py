#!/usr/bin/env python3
"""CoffeeHouse репозиторийінің нақты тарихынан DORA-ның төрт метрикасын есептейді.

Дереккөз — GitHub REST API (коммит, pull request, релиз, deployment, Actions).
Локальды git тек қана салыстыру үшін оқылады. Сандар қолмен жазылмайды.

Өндірістік орналастыру деп мыналар саналады:
- GitHub Deployment, ортасының аты production / prod / live;
- жарияланған GitHub Release;
- v* тегі.

main-ге push және жасыл CI өндірістік орналастыру емес. Олар бөлек кері
байланыс сигналы ретінде көрсетіледі. Сәтсіз өзгеріс үлесі мен қалпына
келтіру уақыты үшін бөлім нөлге тең болса, нәтиже 0% емес, «дерек жеткіліксіз».
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import median

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

LAB = Path(__file__).resolve().parents[1]
REPO = LAB.parent
OUT = LAB / "output"
CHARTS = OUT / "charts"
ALMATY = timezone(timedelta(hours=5))
WINDOW_DAYS = 30
PROD_ENV = re.compile(r"^(production|prod|live)$", re.I)

# dora.dev / Accelerate оқыту шектері. CFR үшін Elite ≤ 15% — жиі қолданылатын
# оқыту шегі; High/Medium кітапта қабаттасады, сондықтан шектер төменде ашық жазылған.
THRESHOLDS = {
    "deployment_frequency": {
        "Elite": "күніне бірнеше рет (тәулігіне > 1)",
        "High": "тәулігіне 1 мен аптасына 1 арасы",
        "Medium": "аптасына 1 мен айына 1 арасы",
        "Low": "айына 1-ден сирек",
    },
    "lead_time": {
        "Elite": "1 күннен аз",
        "High": "1 күн – 1 апта",
        "Medium": "1 апта – 1 ай",
        "Low": "1 айдан ұзақ",
    },
    "change_failure_rate": {
        "Elite": "≤ 15%",
        "High": "15–30%",
        "Medium": "30–45%",
        "Low": "> 45%",
    },
    "time_to_restore": {
        "Elite": "1 сағаттан аз",
        "High": "1 сағат – 1 күн",
        "Medium": "1 күн – 1 апта",
        "Low": "1 аптадан ұзақ",
    },
}


def repo_coords() -> tuple[str, str, str | None]:
    raw = subprocess.check_output(
        ["git", "-C", str(REPO), "remote", "get-url", "origin"], text=True
    ).strip()
    cleaned = re.sub(r"//[^/@]+@", "//", raw)
    match = re.search(
        r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^/\s]+?)(?:\.git)?$", cleaned
    )
    if not match:
        raise SystemExit("origin GitHub мекенжайы емес")
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    embedded = re.match(r"https://([^@/]+)@", raw)
    if token is None and embedded and embedded.group(1).startswith(("ghp_", "github_pat_", "gho_")):
        token = embedded.group(1)
        print(
            "Ескерту: origin URL ішінде кілт бар. Оны URL-ден алып, GITHUB_TOKEN-ге қойыңыз.",
            file=sys.stderr,
        )
    return match.group("owner"), match.group("repo"), token


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def api_get(url: str, token: str | None):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "coffeehouse-lab10",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode() or "null")
        except urllib.error.HTTPError as error:
            body = error.read().decode()
            if error.code == 404:
                return None
            if error.code not in {502, 503, 504}:
                raise SystemExit(
                    f"GitHub API {error.code} {url.split('?')[0]}: {body[:300]}"
                ) from error
            last_error = error
        except urllib.error.URLError as error:
            last_error = error
        time.sleep(2 ** attempt)
    raise SystemExit(f"GitHub API жауап бермеді: {url.split('?')[0]} ({last_error})") from last_error


def paginate(base: str, token: str | None, list_key: str | None = None) -> list:
    page = 1
    rows: list = []
    while page <= 10:
        separator = "&" if "?" in base else "?"
        payload = api_get(f"{base}{separator}per_page=100&page={page}", token)
        if payload is None:
            break
        chunk = payload.get(list_key, []) if list_key else payload
        if not isinstance(chunk, list) or not chunk:
            break
        rows.extend(chunk)
        if len(chunk) < 100:
            break
        page += 1
    return rows


def level_df(count: int, days: float) -> str:
    if days <= 0:
        return "дерек жеткіліксіз"
    per_day = count / days
    if per_day > 1:
        return "Elite"
    if per_day >= 1 / 7:
        return "High"
    if per_day >= 1 / 30:
        return "Medium"
    return "Low"


def level_hours_lead(hours: float) -> str:
    if hours < 24:
        return "Elite"
    if hours < 24 * 7:
        return "High"
    if hours < 24 * 30:
        return "Medium"
    return "Low"


def level_cfr(ratio: float | None) -> str:
    if ratio is None:
        return "дерек жеткіліксіз"
    percent = ratio * 100
    if percent <= 15:
        return "Elite"
    if percent <= 30:
        return "High"
    if percent <= 45:
        return "Medium"
    return "Low"


def level_mttr(hours: float | None) -> str:
    if hours is None:
        return "дерек жеткіліксіз"
    if hours < 1:
        return "Elite"
    if hours < 24:
        return "High"
    if hours < 24 * 7:
        return "Medium"
    return "Low"


def is_production_deployment(item: dict) -> bool:
    environment = item.get("environment") or ""
    if PROD_ENV.match(environment):
        return True
    if item.get("kind") == "release":
        return True
    if item.get("kind") == "tag" and str(item.get("name", "")).startswith("v"):
        return True
    return False


def local_commit_count() -> int | None:
    try:
        raw = subprocess.check_output(
            ["git", "-C", str(REPO), "rev-list", "--count", "HEAD"], text=True
        )
        return int(raw.strip())
    except (subprocess.CalledProcessError, ValueError):
        return None


def configure_font() -> None:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if Path(path).exists():
            font_manager.fontManager.addfont(path)
            plt.rcParams["font.family"] = font_manager.FontProperties(fname=path).get_name()
            break
    plt.rcParams["axes.unicode_minus"] = False


def week_buckets(start: datetime, end: datetime) -> list[datetime]:
    cursor = (start.astimezone(timezone.utc) - timedelta(days=start.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    buckets = []
    while cursor <= end:
        buckets.append(cursor)
        cursor += timedelta(days=7)
    return buckets


def collect() -> dict:
    owner, repo, token = repo_coords()
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=WINDOW_DAYS)
    repository = api_get(f"https://api.github.com/repos/{owner}/{repo}", token)
    if not isinstance(repository, dict):
        raise SystemExit("Репозиторий метадеректері оқылмады")

    commits_raw = paginate(
        f"https://api.github.com/repos/{owner}/{repo}/commits?sha={repository['default_branch']}",
        token,
    )
    pulls = paginate(
        f"https://api.github.com/repos/{owner}/{repo}/pulls?state=all",
        token,
    )
    releases = paginate(f"https://api.github.com/repos/{owner}/{repo}/releases", token)
    tags = paginate(f"https://api.github.com/repos/{owner}/{repo}/tags", token)
    deployments_raw = paginate(
        f"https://api.github.com/repos/{owner}/{repo}/deployments", token
    )
    runs_payload = api_get(
        f"https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=100", token
    )
    runs = (runs_payload or {}).get("workflow_runs", []) if isinstance(runs_payload, dict) else []
    protection = api_get(
        f"https://api.github.com/repos/{owner}/{repo}/branches/{repository['default_branch']}/protection",
        token,
    )

    commits = []
    for item in commits_raw:
        info = item["commit"]
        author = (item.get("author") or {}).get("login") or (info.get("author") or {}).get("name")
        commits.append(
            {
                "sha": item["sha"],
                "date": (info.get("author") or {}).get("date"),
                "message": info.get("message", "").split("\n")[0][:180],
                "author": author,
            }
        )
    commits.sort(key=lambda row: row["date"] or "")

    deployments = []
    for item in deployments_raw:
        statuses = paginate(
            f"https://api.github.com/repos/{owner}/{repo}/deployments/{item['id']}/statuses",
            token,
        )
        state = None
        if statuses:
            latest = max(statuses, key=lambda row: row.get("created_at") or "")
            state = latest.get("state")
        deployments.append(
            {
                "id": item.get("id"),
                "kind": "deployment",
                "environment": item.get("environment"),
                "sha": item.get("sha"),
                "created_at": item.get("created_at"),
                "state": state,
            }
        )
    for release in releases:
        if release.get("draft"):
            continue
        deployments.append(
            {
                "id": release.get("id"),
                "kind": "release",
                "name": release.get("tag_name"),
                "environment": "production",
                "sha": (release.get("target_commitish") or ""),
                "created_at": release.get("published_at") or release.get("created_at"),
                "state": "success",
            }
        )
    for tag in tags:
        name = tag.get("name") or ""
        if not name.startswith("v"):
            continue
        deployments.append(
            {
                "id": name,
                "kind": "tag",
                "name": name,
                "environment": "production",
                "sha": ((tag.get("commit") or {}).get("sha")),
                "created_at": None,
                "state": "success",
            }
        )

    def in_window(value: str | None) -> bool:
        moment = parse_dt(value)
        return bool(moment and window_start <= moment <= now)

    window_commits = [row for row in commits if in_window(row["date"])]
    window_deploys = [row for row in deployments if in_window(row["created_at"])]
    prod = [row for row in window_deploys if is_production_deployment(row)]
    staging = [row for row in window_deploys if not is_production_deployment(row)]

    # Lead time: әр прод орналастыруға кірген, алдыңғысынан кейінгі коммиттер.
    prod_sorted = sorted(prod, key=lambda row: row["created_at"] or "")
    lead_hours: list[float] = []
    for index, deploy in enumerate(prod_sorted):
        deploy_at = parse_dt(deploy["created_at"])
        if deploy_at is None:
            continue
        previous = parse_dt(prod_sorted[index - 1]["created_at"]) if index else None
        for commit in window_commits:
            commit_at = parse_dt(commit["date"])
            if commit_at is None or commit_at > deploy_at:
                continue
            if previous and commit_at <= previous:
                continue
            lead_hours.append((deploy_at - commit_at).total_seconds() / 3600)

    failed = []
    restored_hours: list[float] = []
    for index, deploy in enumerate(prod_sorted):
        state = (deploy.get("state") or "").lower()
        if state not in {"failure", "error"}:
            continue
        failed.append(deploy)
        deploy_at = parse_dt(deploy["created_at"])
        nxt = next(
            (
                item
                for item in prod_sorted[index + 1 :]
                if (item.get("state") or "").lower() in {"success", ""}
            ),
            None,
        )
        if deploy_at and nxt and parse_dt(nxt["created_at"]):
            restored_hours.append(
                (parse_dt(nxt["created_at"]) - deploy_at).total_seconds() / 3600
            )

    revert_commits = [
        row for row in window_commits if row["message"].lower().startswith("revert")
    ]

    days = WINDOW_DAYS
    df_count = len(prod)
    per_day = df_count / days
    median_lead = median(lead_hours) if lead_hours else None
    cfr_ratio = (len(failed) / df_count) if df_count else None
    mttr = median(restored_hours) if restored_hours else None

    diagnostic = None
    if window_commits and df_count == 0:
        oldest = min(parse_dt(row["date"]) for row in window_commits if row["date"])
        age_hours = (now - oldest).total_seconds() / 3600
        diagnostic = {
            "oldest_undeployed_commit": oldest.isoformat(),
            "age_days": round(age_hours / 24, 2),
            "lower_bound_level_if_deployed_now": level_hours_lead(age_hours),
            "note": (
                "Бұл lead time емес, төменгі шек. Өзгеріс өндіріске әлі шықпаған. "
                "Бүгін шықса, lead time кемінде осы жасқа тең болар еді."
            ),
        }

    run_rows = []
    durations = []
    for run in runs:
        started = parse_dt(run.get("run_started_at") or run.get("created_at"))
        finished = parse_dt(run.get("updated_at"))
        minutes = None
        if started and finished and run.get("status") == "completed" and finished >= started:
            minutes = round((finished - started).total_seconds() / 60, 2)
            if in_window(run.get("created_at")):
                durations.append(minutes)
        run_rows.append(
            {
                "id": run.get("id"),
                "name": run.get("name"),
                "event": run.get("event"),
                "status": run.get("status"),
                "conclusion": run.get("conclusion"),
                "head_branch": run.get("head_branch"),
                "head_sha": run.get("head_sha"),
                "created_at": run.get("created_at"),
                "html_url": run.get("html_url"),
                "duration_minutes": minutes,
            }
        )

    reviews = (protection or {}).get("required_pull_request_reviews") if isinstance(protection, dict) else None
    checks = (protection or {}).get("required_status_checks") if isinstance(protection, dict) else None
    protection_summary = {
        "enabled": isinstance(protection, dict),
        "enforce_admins": ((protection or {}).get("enforce_admins") or {}).get("enabled")
        if isinstance(protection, dict)
        else None,
        "required_approving_review_count": (reviews or {}).get("required_approving_review_count"),
        "dismiss_stale_reviews": (reviews or {}).get("dismiss_stale_reviews"),
        "required_status_checks": (checks or {}).get("contexts"),
        "strict": (checks or {}).get("strict"),
        "conversation_resolution": (
            (protection or {}).get("required_conversation_resolution") or {}
        ).get("enabled")
        if isinstance(protection, dict)
        else None,
        "allow_force_pushes": ((protection or {}).get("allow_force_pushes") or {}).get("enabled")
        if isinstance(protection, dict)
        else None,
    }

    metrics = {
        "schema_version": 1,
        "project": "CoffeeHouse",
        "repository": f"{owner}/{repo}",
        "html_url": repository.get("html_url"),
        "private": repository.get("private"),
        "default_branch": repository.get("default_branch"),
        "generated_at": now.isoformat(),
        "timezone": "Asia/Almaty",
        "window": {
            "days": WINDOW_DAYS,
            "start": window_start.isoformat(),
            "end": now.isoformat(),
        },
        "thresholds": THRESHOLDS,
        "usage_policy": (
            "DORA деңгейі команданың жеткізу жүйесін талқылауға арналған. "
            "Оны жеке адамның бонусына, рейтингіне немесе жазасына байламаңыз. "
            "Сәтсіз өзгеріс пен қалпына келтіру үшін дерек жоқ кезде 0 деп жазу — "
            "метриканы жасыру, жақсарту емес."
        ),
        "sources": {
            "github_commits": len(commits),
            "github_commits_in_window": len(window_commits),
            "local_head_count": local_commit_count(),
            "pull_requests": len(pulls),
            "releases": len([row for row in releases if not row.get("draft")]),
            "tags": len(tags),
            "deployment_records": len(deployments_raw),
            "workflow_runs": len(run_rows),
        },
        "commits": commits,
        "pull_requests": [
            {
                "number": item.get("number"),
                "title": item.get("title"),
                "state": item.get("state"),
                "merged_at": item.get("merged_at"),
                "created_at": item.get("created_at"),
                "user": (item.get("user") or {}).get("login"),
            }
            for item in pulls
        ],
        "deployments": deployments,
        "workflow_runs": run_rows,
        "branch_protection": protection_summary,
        "deployment_frequency": {
            "production_deployments": df_count,
            "staging_deployments": len(staging),
            "window_days": days,
            "per_day": round(per_day, 4),
            "per_week": round(per_day * 7, 4),
            "per_month": round(per_day * 30, 4),
            "level": level_df(df_count, days),
            "definition": "Соңғы 30 күндегі өндірістік орналастыру саны. CI жасыл болуы деплой емес.",
        },
        "lead_time": {
            "sample_count": len(lead_hours),
            "median_hours": round(median_lead, 2) if median_lead is not None else None,
            "level": level_hours_lead(median_lead) if median_lead is not None else "дерек жеткіліксіз",
            "diagnostic": diagnostic,
            "definition": "Коммит уақытынан сол коммитті қамтыған өндірістік орналастыруға дейін. Медиана.",
        },
        "change_failure_rate": {
            "failed": len(failed) if df_count else None,
            "total": df_count,
            "revert_commits": len(revert_commits),
            "ratio": round(cfr_ratio, 4) if cfr_ratio is not None else None,
            "level": level_cfr(cfr_ratio),
            "definition": (
                "Сәтсіз аяқталған өндірістік орналастыру / барлық өндірістік орналастыру. "
                "Бөлім 0 болса, үлес есептелмейді."
            ),
        },
        "time_to_restore": {
            "sample_count": len(restored_hours),
            "median_hours": round(mttr, 2) if mttr is not None else None,
            "level": level_mttr(mttr),
            "definition": "Сәтсіз өндірістік орналастырудан келесі сәттісіне дейін. Медиана.",
        },
        "devex": {
            "pull_requests": len(pulls),
            "direct_pushes_to_main": len(commits),
            "ci_runs_in_window": len([row for row in run_rows if in_window(row["created_at"])]),
            "ci_success": len([row for row in run_rows if row["conclusion"] == "success"]),
            "ci_failure": len(
                [row for row in run_rows if row["conclusion"] in {"failure", "cancelled", "timed_out"}]
            ),
            "median_feedback_minutes": round(median(durations), 2) if durations else None,
            "environment_note": (
                "docker-compose.yml PostgreSQL қызметін көтереді, бірақ қолданба "
                "DATABASE_URL=file:./prisma/dev.db арқылы SQLite-ты қолданады. "
                "Жергілікті орта, CI (SQLite ci.db) және compose бір дерекқор әңгімесін айтпайды."
            ),
        },
    }
    metrics["improvements"] = improvements(metrics)
    metrics["space"] = {
        "satisfaction": "Өлшенбеген. Келесі ретрода 1–5 шкала, жеке жазасыз.",
        "performance": "DORA — нәтиже. Жеке өнімділік ретінде коммит санын қолданбаңыз.",
        "activity": f"Терезедегі коммит: {len(window_commits)}. Белсенділік жеткізу емес.",
        "communication": f"Pull request: {len(pulls)}. Ревью ілмегі әлі жоқ, талап PR үлгісінде.",
        "efficiency_and_flow": (
            "Үзіліс пен кері байланыс: CI ұзақтығы "
            + (
                f"{metrics['devex']['median_feedback_minutes']} мин."
                if metrics["devex"]["median_feedback_minutes"] is not None
                else "әлі өлшенбеген"
            )
            + ". Ағынды сейсенбілік прод терезесі және lab09 WIP лимиті қорғайды."
        ),
    }
    return metrics


def improvements(metrics: dict) -> dict:
    df = metrics["deployment_frequency"]
    lead = metrics["lead_time"]
    age = (lead.get("diagnostic") or {}).get("age_days")
    age_text = f"{age:.0f} күн" if isinstance(age, (int, float)) else "белгісіз"
    bound = (lead.get("diagnostic") or {}).get("lower_bound_level_if_deployed_now", "—")
    feedback = metrics["devex"]["median_feedback_minutes"]
    feedback_text = f"{feedback} мин" if feedback is not None else "әлі жоқ (құбыржол алғаш рет осы лабораторияда қосылды)"
    return {
        "deployment_frequency": [
            {
                "title": "Әр біріктіруден кейін staging",
                "action": (
                    "Ұзақ бұтақ жоқ. PR 400 жолдан аспайды, lint-and-test және build жасыл "
                    "болғанда main staging-ке автоматты орналастырылады. Продакшен тек сейсенбі 15:30 терезесінде."
                ),
                "expected_effect": (
                    f"Қазір прод орналастыру {df['production_deployments']} "
                    f"({df['per_week']}/апта), деңгей {df['level']}. "
                    "Күтілетін әсер: staging жиілігі аптасына кемінде 3 (High), "
                    "прод жиілігі айына 0-ден аптасына 1-ге (Low → Medium)."
                ),
            },
            {
                "title": "Деплой мен релизді feature flag арқылы бөлу",
                "action": (
                    "Жаңа тапсырыс немесе брондау main-ге өшірулі flag-пен енеді. "
                    "Релиз — терезеде flag-ті қосу, кері қайтару — flag-ті өшіру."
                ),
                "expected_effect": (
                    "Кодты продқа күнде жіберуге болады (DF High шегі: тәулігіне 1-ге дейін), "
                    "пайдаланушы тәуекелі сейсенбілік терезеде қалады. Сәтсіз релиз жаңа құрастыруды күтпей тоқтайды."
                ),
            },
        ],
        "lead_time": [
            {
                "title": "Кері байланысты 15 минуттың астына түсіру",
                "action": (
                    "PR міндетті CI-ды күтеді. Қазіргі кері байланыс ұзақтығы: "
                    f"{feedback_text}. Мақсат — lint, тест және build бірге 15 минуттан қысқа."
                ),
                "expected_effect": (
                    f"Аяқталмаған өзгерістің жасы {age_text} (бүгін шықса деңгей {bound}). "
                    "Күтілетін әсер: commit → staging 1 күннен аз (Elite/High шегі), "
                    "өйткені ревью CI аяқталғанша тоқтап қалмайды."
                ),
            },
            {
                "title": "Тікелей main орнына қысқа PR",
                "action": (
                    "Қорғау ережесі write-қолжетімді авторлардан бір бекіту сұрайды. "
                    "PR үлгісінде қабылдау критерийі бар. Trunk-based: бұтақ бір-екі күннен ұзақ өмір сүрмейді."
                ),
                "expected_effect": (
                    "Қазір pull request 0, сондықтан ревью уақыты өлшенбейді, ал өзгеріс "
                    f"{age_text} бойы шықпай тұр. Күтілетін әсер: commit → прод келесі сейсенбіде, "
                    f"яғни 7 күннен аспайды (Medium). {age_text} тоқтап тұру қайталанбайды."
                ),
            },
        ],
        "change_failure_rate": [
            {
                "title": "Релиз алдындағы бес қадамдық smoke",
                "action": (
                    "Басты бет, мәзір, sandbox тапсырыс, брондау, админ кіру — терезеде, "
                    "пайдаланушыға ашпас бұрын. Сәтсіз smoke прод релизін тоқтатады және журналда сәтсіз өзгеріс болады."
                ),
                "expected_effect": (
                    "Қазір үлес есептелмейді: өндірістік орналастыру 0, оны 0% деп жазуға болмайды. "
                    "Күтілетін әсер: алғашқы 8 прод релизінен кейін үлес шынайы шығады және smoke арқылы ≤ 15% (Elite шегі) мақсаты ұсталады."
                ),
            },
            {
                "title": "Алдымен қызметкер, содан кейін қонақ",
                "action": (
                    "Canary осы жобаның масштабында: flag әуелі админ/қызметкер сессиясында, "
                    "15 минуттық бақылаудан кейін барлық қонаққа. Blue-green — екі compose жобасы, портты ауыстыру."
                ),
                "expected_effect": (
                    "Ақау алдымен ішкі пайдаланушыға тиеді. Тоқтатылған canary бір сәтсіз өзгеріс болып жазылады, "
                    "жасырылмайды. Пайдаланушыға жеткен сәтсіз релиз үлесінің мақсаты ≤ 15%."
                ),
            },
        ],
        "time_to_restore": [
            {
                "title": "Алдыңғы artifact-қа бір қадаммен оралу",
                "action": (
                    "CI соңғы жасыл standalone мұрағатын 14 күн сақтайды. Инцидент болса, "
                    "Нұрбиби алдыңғы SHA-ны көтереді, Элеонора smoke жасайды, Назгүл уақытты жазады. "
                    "Чек-парақ: lab10/release/rollback-checklist.md."
                ),
                "expected_effect": (
                    "Қазір MTTR өлшенбейді: сәтсіз прод орналастыру да, қалпына келтіру де жоқ. "
                    "Күтілетін әсер: анықталған сәттен қалпына келгенше 30 минуттан аз (Elite шегі — 1 сағаттан аз)."
                ),
            },
            {
                "title": "Сұлбаны кері қайтарылмайтын етіп өзгертпеу",
                "action": (
                    "SQLite файлы терезеден 15 минут бұрын көшіріледі. Релизде баған өшірілмейді: "
                    "алдымен expand, келесі терезеде ғана contract. Кері қайтару қолданбаны ауыстырады, "
                    "дерекқорды қолмен жөндемейді."
                ),
                "expected_effect": (
                    "Қалпына келтіру дерек файлын іздеуге айналып кетпейді. "
                    "Сұлба өзгерген сирек релизде көшірмеден оралу да 1 сағаттың ішінде қалады."
                ),
            },
        ],
    }


def write_charts(metrics: dict) -> None:
    configure_font()
    CHARTS.mkdir(parents=True, exist_ok=True)
    start = parse_dt(metrics["window"]["start"])
    end = parse_dt(metrics["window"]["end"])
    buckets = week_buckets(start, end)
    commit_counts = []
    deploy_counts = []
    labels = []
    for bucket in buckets:
        nxt = bucket + timedelta(days=7)
        labels.append(bucket.astimezone(ALMATY).strftime("%m-%d"))
        commit_counts.append(
            sum(
                1
                for row in metrics["commits"]
                if (moment := parse_dt(row["date"])) and bucket <= moment < nxt and start <= moment <= end
            )
        )
        deploy_counts.append(
            sum(
                1
                for row in metrics["deployments"]
                if is_production_deployment(row)
                and (moment := parse_dt(row["created_at"]))
                and bucket <= moment < nxt
                and start <= moment <= end
            )
        )

    fig, ax = plt.subplots(figsize=(8.2, 4.2))
    positions = range(len(labels))
    ax.bar([p - 0.18 for p in positions], commit_counts, width=0.36, label="main коммит", color="#6f4e37")
    ax.bar([p + 0.18 for p in positions], deploy_counts, width=0.36, label="прод деплой", color="#2a9d8f")
    ax.set_xticks(list(positions), labels)
    ax.set_ylabel("Саны")
    ax.set_title("30 күн: коммит пен өндірістік орналастыру")
    ax.legend()
    ax.set_ylim(bottom=0)
    fig.tight_layout()
    fig.savefig(CHARTS / "activity_weekly.png", dpi=140)
    plt.close(fig)

    names = ["DF", "Lead time", "CFR", "MTTR"]
    levels = [
        metrics["deployment_frequency"]["level"],
        metrics["lead_time"]["level"],
        metrics["change_failure_rate"]["level"],
        metrics["time_to_restore"]["level"],
    ]
    score = {"Elite": 4, "High": 3, "Medium": 2, "Low": 1}
    values = [score.get(level, 0) for level in levels]
    colors = ["#2a9d8f" if value else "#9ca3af" for value in values]
    fig, ax = plt.subplots(figsize=(8.2, 4.2))
    bars = ax.barh(names, values, color=colors)
    ax.set_xlim(0, 4)
    ax.set_xlabel("0 дерек жоқ · 1 Low · 2 Medium · 3 High · 4 Elite")
    ax.set_title("DORA деңгейі (0% деп толтырылмаған)")
    for bar, level in zip(bars, levels):
        origin = bar.get_width() if bar.get_width() else 0.12
        ax.text(origin + 0.08, bar.get_y() + bar.get_height() / 2, level, va="center")
    fig.tight_layout()
    fig.savefig(CHARTS / "levels.png", dpi=140)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(8.2, 3.6))
    bands = [("Elite\n< 1 күн", 1), ("High\n< 1 апта", 7), ("Medium\n< 1 ай", 30), ("Low\n≥ 1 ай", 45)]
    ax.bar([item[0] for item in bands], [item[1] for item in bands], color="#e7e5e4")
    diagnostic = metrics["lead_time"].get("diagnostic") or {}
    if diagnostic.get("age_days") is not None:
        ax.axhline(diagnostic["age_days"], color="#9b2226", linestyle="--", label="шықпаған өзгерістің жасы")
        ax.legend()
    ax.set_ylabel("Күн")
    ax.set_title("Lead time шегі және шықпаған өзгерістің төменгі шегі")
    fig.tight_layout()
    fig.savefig(CHARTS / "lead_time_bound.png", dpi=140)
    plt.close(fig)


def fmt_num(value, suffix="") -> str:
    if value is None:
        return "—"
    if isinstance(value, float):
        text = f"{value:.2f}".rstrip("0").rstrip(".")
        return f"{text}{suffix}"
    return f"{value}{suffix}"


def write_report(metrics: dict) -> None:
    df = metrics["deployment_frequency"]
    lead = metrics["lead_time"]
    cfr = metrics["change_failure_rate"]
    mttr = metrics["time_to_restore"]
    devex = metrics["devex"]
    protection = metrics["branch_protection"]
    commits = "\n".join(
        f"- `{row['sha'][:7]}` {row['date']} {row['author']}: {row['message']}" for row in metrics["commits"]
    )
    lines = [
        "# CoffeeHouse — DORA есебі",
        "",
        f"Репозиторий: [{metrics['repository']}]({metrics['html_url']})",
        f"Есептелген: {metrics['generated_at']} (терезе {metrics['window']['days']} күн, {metrics['timezone']}).",
        "Сандар GitHub API жауабынан. Қолмен толтырылған мақсат жоқ.",
        "",
        metrics["usage_policy"],
        "",
        "## Дерек",
        "",
        f"- Коммит (бүкіл default branch): {metrics['sources']['github_commits']}",
        f"- Коммит (30 күн): {metrics['sources']['github_commits_in_window']}",
        f"- Локальды `git rev-list --count HEAD`: {metrics['sources']['local_head_count']}",
        f"- Pull request: {metrics['sources']['pull_requests']}",
        f"- Release: {metrics['sources']['releases']}; тег: {metrics['sources']['tags']}; GitHub Deployment: {metrics['sources']['deployment_records']}",
        f"- Actions іске қосылуы: {metrics['sources']['workflow_runs']}",
        f"- main қорғауы: {'қосулы' if protection['enabled'] else 'өшірулі'}",
        "",
        "### Коммиттер",
        "",
        commits or "- жоқ",
        "",
        "## Төрт метрика",
        "",
        "| Метрика | Мән | Деңгей |",
        "|---|---|---|",
        f"| Орналастыру жиілігі | {df['production_deployments']} прод / {df['window_days']} күн = {df['per_week']}/апта | {df['level']} |",
        f"| Lead time (медиана) | {fmt_num(lead['median_hours'], ' сағ')} ({lead['sample_count']} үлгі) | {lead['level']} |",
        f"| Сәтсіз өзгеріс үлесі | {fmt_num(None if cfr['ratio'] is None else round(cfr['ratio'] * 100, 2), '%')} ({'—' if cfr['failed'] is None else cfr['failed']} / {cfr['total']}) | {cfr['level']} |",
        f"| Қалпына келтіру (медиана) | {fmt_num(mttr['median_hours'], ' сағ')} ({mttr['sample_count']} үлгі) | {mttr['level']} |",
        "",
    ]
    diagnostic = lead.get("diagnostic")
    if diagnostic:
        lines += [
            f"Lead time үлгісі жоқ. Ең ескі шықпаған коммиттің жасы {diagnostic['age_days']} күн. "
            f"Бүгін өндіріске шықса, деңгей {diagnostic['lower_bound_level_if_deployed_now']} болар еді. "
            f"{diagnostic['note']}",
            "",
        ]
    lines += [
        "CI мен main-ге push бұл кестеге прод деплой ретінде кірмейді. "
        f"CI іске қосылуы: {devex['ci_runs_in_window']}, сәтті: {devex['ci_success']}, сәтсіз: {devex['ci_failure']}. "
        f"Кері байланыс медианасы: {fmt_num(devex['median_feedback_minutes'], ' мин')}.",
        "",
        "## Неге бұл KPI емес",
        "",
        "Жиілікті бос коммитпен, сәтсіздік үлесін инцидентті жазбай, қалпына келтіруді тикетті ерте жабумен "
        "«жақсартуға» болады. Сондықтан деңгей адамды бағаламайды. Қарсы салмақ — SPACE: "
        "қанағаттану, нәтиже, белсенділік, коммуникация, тиімділік пен ағын. "
        f"Қазіргі белсенділік ({metrics['space']['activity']}) жеткізуді білдірмейді, "
        f"ал коммуникация ({metrics['space']['communication']}) әлі ашылмаған.",
        "",
        "PM тікелей жылжыта алатын төрт нәрсе:",
        "",
        f"1. Құрастыру уақыты. Өлшем: {fmt_num(devex['median_feedback_minutes'], ' мин')}. Мақсат < 15 мин.",
        f"2. Ортаның сапасы. {devex['environment_note']}",
        "3. Талаптың айқындығы. PR үлгісінде қабылдау критерийі міндетті. Қазір PR жоқ, сондықтан шарт ревьюде көрінбейді.",
        "4. Үзіліс. Прод тек сейсенбі 15:30–16:30. Апта ортасында тосын релиз жоқ. Lab09 WIP лимиті ағынды сақтайды.",
        "",
        "## Әр метрикаға екі жақсарту",
        "",
    ]
    titles = {
        "deployment_frequency": "Орналастыру жиілігі",
        "lead_time": "Lead time",
        "change_failure_rate": "Сәтсіз өзгеріс үлесі",
        "time_to_restore": "Қалпына келтіру уақыты",
    }
    for key, title in titles.items():
        lines.append(f"### {title} — {metrics[key]['level'] if key != 'deployment_frequency' else df['level']}")
        lines.append("")
        current = metrics["deployment_frequency"] if key == "deployment_frequency" else metrics[key]
        if key == "deployment_frequency":
            lines.append(f"Қазір: {current['level']}, {current['per_week']}/апта.")
        else:
            lines.append(f"Қазір: {current['level']}.")
        lines.append("")
        for index, item in enumerate(metrics["improvements"][key], start=1):
            lines.append(f"{index}. **{item['title']}.** {item['action']} {item['expected_effect']}")
            lines.append("")
    lines += [
        "## Техқарыз бен сенімділік үлесі",
        "",
        "Үш адам, аптасына 5 күн — 15 адам-күн. Соның 20%-ы (3 адам-күн) техқарыз бен сенімділікке: "
        "құбыржол, тест, орта, кері қайтару. Негіздеме: шықпаған өзгерістің жасы шамамен ай, "
        "қалпына келтіру жолы осы лабораторияға дейін болмаған. Бір апталық функция жұмысы "
        "қайтарылмайтын релизде жоғалуы мүмкін. Өлшем кейін: `debt` және `reliability` белгісі бар PR үлесі. "
        "Қазір PR 0, сондықтан үлес өлшенбейді. 20% — өлшенген нәтиже емес, бронь.",
        "",
        "## Платформалық жұмыс жоспарды қалай өзгертеді",
        "",
        "Бөлек платформалық команда жоқ. CI, сканер және артефакт — ішкі платформаның алғашқы жолы, "
        "оны қазір Нұрбиби ұстайды. Осы жол тұрақты болғанда функционалдық тапсырмаға «деплойды баптау» "
        "кірмейді: әр story тек өнім өзгерісін бағалайды, ал платформа жұмысы бөлек кезекке түседі. "
        "Мерзім енді «ноутбукта жиналса» емес, сейсенбілік терезеге байланады. Lead time жоспарланатын болады.",
        "",
        "## Шектеу",
        "",
        "Тег, релиз және GitHub Deployment жоқ. Сондықтан жиілік Low, қалған екі метриканың ресми мәні жоқ. "
        "Бұл әлсіз команда деген үкім емес: өлшеу жүйесі енді ғана қосылды.",
        "",
    ]
    (OUT / "dora-report.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    metrics = collect()
    (OUT / "metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_charts(metrics)
    write_report(metrics)
    df = metrics["deployment_frequency"]
    print(
        f"{metrics['repository']}: commits={metrics['sources']['github_commits']} "
        f"prod_deploys={df['production_deployments']} DF={df['level']} "
        f"LT={metrics['lead_time']['level']} CFR={metrics['change_failure_rate']['level']} "
        f"MTTR={metrics['time_to_restore']['level']}"
    )


if __name__ == "__main__":
    main()
