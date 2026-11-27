"""Екі спринттің статус фактілері. Сан метрика файлынан көшіріледі, модельден алынбайды."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

LAB = Path(__file__).resolve().parents[1]
ROOT = LAB.parents[0]
AGE_DAYS = 1.0
SECRET = re.compile(
    r"(ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|BEGIN PRIVATE KEY|postgres(?:ql)?://\S+)",
    re.I,
)
CREDENTIALS = re.compile(r"://[^/@\s]+@")
STATUS_KK = {
    "backlog": "Backlog",
    "ready": "Ready",
    "in_progress": "In Progress",
    "code_review": "Code Review",
    "testing": "Testing",
    "done": "Done",
}


def fmt_num(value: float, digits: int) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


def fmt_count(value: float) -> str:
    if float(value).is_integer():
        return str(int(value))
    return fmt_num(value, 1)


def public_remote(url: str) -> str:
    return CREDENTIALS.sub("://", url.strip())


def assert_no_secrets(text: str) -> None:
    found = SECRET.search(text)
    if found:
        raise RuntimeError("Факті пакетінде құпияға ұқсас жол бар. Модельге жіберілмейді.")


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _names(project: dict) -> dict[str, str]:
    return {person["id"]: person["name"] for person in project["team"]}


def _git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


def _repo_slug(root: Path) -> str | None:
    try:
        url = public_remote(_git(root, "remote", "get-url", "origin"))
    except subprocess.CalledProcessError:
        return None
    match = re.search(r"github\.com[:/]([^/]+)/([^/\s.]+)", url)
    if not match:
        return None
    return f"{match.group(1)}/{match.group(2)}"


def _local_commits(root: Path) -> list[dict[str, str]]:
    raw = _git(root, "log", "--date=iso-strict", "--pretty=format:%H%x09%ad%x09%s")
    rows = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        sha, when, subject = line.split("\t", 2)
        rows.append({"sha": sha[:7], "at": when, "subject": subject})
    return rows


def _in_window(stamp: str, start: str, end: str) -> bool:
    return start <= stamp <= end


def fetch_github_commits(slug: str, token: str | None, start: str, end: str) -> dict:
    query = f"https://api.github.com/repos/{slug}/commits?since={start}&until={end}&per_page=100"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "coffeehouse-pm-status",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(query, headers=headers)
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode())
            status = response.status
    except HTTPError as error:
        return {"ok": False, "status": error.code, "count": None, "error": f"HTTP {error.code}"}
    except URLError as error:
        return {"ok": False, "status": None, "count": None, "error": str(error.reason)}
    if not isinstance(payload, list):
        return {"ok": False, "status": status, "count": None, "error": "жауап тізім емес"}
    return {"ok": True, "status": status, "count": len(payload), "error": None}


def _task_index(sprint: dict) -> dict[str, dict]:
    return {task["id"]: task for task in sprint["tasks"]}


def _open_items(sprint: dict, names: dict[str, str]) -> list[dict]:
    index = _task_index(sprint)
    rows = []
    for item in sprint["not_completed"]:
        task = index[item["id"]]
        age_days = task.get("age_end_days")
        row = {
            "id": task["id"],
            "title": task["title"],
            "status": STATUS_KK.get(task["status_end"], task["status_end"]),
            "assignee": names.get(task["assignee"], task["assignee"]),
            "age_days": None if age_days is None else fmt_num(age_days, 2),
            "age_hours": None if task.get("age_end_hours") is None else fmt_num(task["age_end_hours"], 2),
            "aged": age_days is not None and age_days >= AGE_DAYS,
        }
        rows.append(row)
    return rows


def _defects(tasks: dict, start: str, end: str) -> list[dict[str, str]]:
    found = []
    for task in tasks["tasks"]:
        for event in task["history"]:
            note = event.get("note") or ""
            if event["at"] < start or event["at"] > end:
                continue
            if "АҚАУ" in note or "rework" in note.lower():
                found.append({"id": task["id"], "at": event["at"], "note": note})
    return found


def _sprint_facts(metrics_sprint: dict, project_sprint: dict, names: dict[str, str], tasks: dict) -> dict:
    testing = metrics_sprint["testing"]
    wip = metrics_sprint["wip"]
    cycle = metrics_sprint["cycle_time"]
    cycle_new = metrics_sprint["cycle_time_new"]
    daily = [
        {"date": row["date"], "count": fmt_count(row["count"]), "ids": row["ids"]}
        for row in metrics_sprint["throughput_per_day"]
    ]
    return {
        "id": project_sprint["id"],
        "name": project_sprint["name"],
        "start": project_sprint["start"],
        "end": project_sprint["end"],
        "goal": project_sprint["goal"],
        "goal_status": project_sprint["review"]["goal_status"],
        "scope_count": fmt_count(metrics_sprint["scope_count"]),
        "done_count": fmt_count(metrics_sprint["throughput"]),
        "done_ids": list(metrics_sprint["completed"]),
        "open": _open_items(metrics_sprint, names),
        "carry_over": list(project_sprint.get("carry_over") or []),
        "throughput": fmt_count(metrics_sprint["throughput"]),
        "throughput_daily": daily,
        "completion_pct": fmt_num(metrics_sprint["completion_pct"], 1),
        "sp_scope": fmt_count(metrics_sprint["sp_scope"]),
        "sp_done": fmt_count(metrics_sprint["sp_done"]),
        "sp_completion_pct": fmt_num(metrics_sprint["sp_completion_pct"], 1),
        "avg_cycle_days": fmt_num(cycle["avg_days"], 2),
        "p85_cycle_days": fmt_num(cycle["p85_days"], 2),
        "avg_cycle_days_new": fmt_num(cycle_new["avg_days"], 2),
        "p85_cycle_days_new": fmt_num(cycle_new["p85_days"], 2),
        "wip_avg_eod": fmt_num(wip["avg_eod"], 2),
        "wip_peak": fmt_count(wip["peak"]),
        "testing_avg_eod": fmt_num(testing["avg_eod"], 2),
        "testing_peak": fmt_count(testing["peak"]),
        "testing_limit": fmt_count(metrics_sprint["column_stats"]["testing"]["wip_limit"]),
        "testing_violations": fmt_count(testing["violations"]),
        "testing_over_hours": fmt_num(testing["over_limit_hours"], 2),
        "testing_avg_hours": fmt_num(testing["avg_time_hours"], 2),
        "impediments": [
            {
                "text": item["text"],
                "tasks": item["tasks"],
                "owner": names.get(item["owner"], item["owner"]),
            }
            for item in project_sprint["impediments"]
        ],
        "not_done_explanation": list(project_sprint["review"]["not_done_explanation"]),
        "defects": _defects(tasks, project_sprint["start"], project_sprint["end"]),
    }


def build_facts(root: Path | None = None, github_token: str | None = None, github_fetcher=None) -> dict:
    root = root or ROOT
    project = _load(root / "lab09" / "data" / "project.json")
    tasks = _load(root / "lab09" / "data" / "tasks.json")
    metrics = _load(root / "lab09" / "output" / "metrics.json")
    names = _names(project)
    by_id = {row["id"]: row for row in project["sprints"]}
    sprints = []
    for key in ("1", "2"):
        block = metrics["sprints"][key]
        sprints.append(_sprint_facts(block, by_id[int(key)], names, tasks))

    commits = _local_commits(root)
    windows = []
    for sprint in sprints:
        count = sum(1 for row in commits if _in_window(row["at"], sprint["start"], sprint["end"]))
        windows.append({"sprint": sprint["id"], "local_git_commits": count})

    slug = _repo_slug(root)
    github = {"slug": slug, "windows": []}
    fetcher = github_fetcher or fetch_github_commits
    if slug is None:
        github["error"] = "origin ішінде github.com жолы табылмады"
    else:
        for sprint in sprints:
            github["windows"].append(
                {"sprint": sprint["id"], **fetcher(slug, github_token, sprint["start"], sprint["end"])}
            )

    action = metrics["action_evaluation"]
    facts = {
        "project": project["project"]["name"],
        "as_of": by_id[2]["end"],
        "timezone": project["meta"]["timezone"],
        "simulation": project["meta"]["simulation_disclaimer"],
        "team": [{"name": person["name"], "role": person["role"]} for person in project["team"]],
        "sources": [
            "lab09/data/tasks.json",
            "lab09/data/project.json",
            "lab09/output/metrics.json",
            "жергілікті git log",
        ],
        "rules": {
            "aged_days": fmt_num(AGE_DAYS, 0),
            "cycle_time": "Cycle Time = алғаш Done − алғаш In Progress, күнтізбелік күн.",
            "throughput": "Throughput = спринт терезесінде Done болған тапсырма саны.",
            "p85": "P85 nearest-rank. Көрсетілетін сан metrics.json-нан 2 таңбаға дөңгелектелген.",
            "numbers": "Төмендегі сандар көрсету үшін дөңгелектелген. Қайта дөңгелектеме.",
        },
        "sprints": sprints,
        "retro_action": {
            "id": action["action_id"],
            "metric": action["metric_name"],
            "before": fmt_num(action["before"], 2),
            "after": fmt_num(action["after"], 2),
            "reduction_pct": fmt_num(action["reduction_pct"], 1),
            "target_pct": fmt_count(action["target_reduction_pct"]),
            "achieved": action["achieved"],
        },
        "rework": {
            "sprint_1": fmt_count(next(row["s1"] for row in metrics["comparison"] if row["key"] == "rework")),
            "sprint_2": fmt_count(next(row["s2"] for row in metrics["comparison"] if row["key"] == "rework")),
        },
        "cross_testing_pct": {
            "sprint_1": fmt_num(
                next(row["s1"] for row in metrics["comparison"] if row["key"] == "cross_testing_pct"), 1
            ),
            "sprint_2": fmt_num(
                next(row["s2"] for row in metrics["comparison"] if row["key"] == "cross_testing_pct"), 1
            ),
        },
        "repository": {
            "local_commits_outside_sprint_windows": [
                {"sha": row["sha"], "at": row["at"][:10], "subject": row["subject"]} for row in commits
            ],
            "windows": windows,
            "github_api": github,
            "use_count_from": "жергілікті git. API саны сәйкес келсе ғана растау. API қатесі нөл коммит дегенді білдірмейді.",
        },
        "next_action": {
            "text": "CH-209 брондау тесті Sprint 2 соңында In Progress. Sprint 3-ке ауысады деп Sprint 2 шолуында жазылған.",
            "owner": names.get("nazgul", "nazgul"),
            "due": "дерек жоқ",
        },
    }
    assert_no_secrets(json.dumps(facts, ensure_ascii=False))
    return facts


def _daily_line(sprint: dict) -> str:
    parts = [f"{row['date']}={row['count']} ({', '.join(row['ids']) or '—'})" for row in sprint["throughput_daily"]]
    return "; ".join(parts)


def _open_line(item: dict) -> str:
    age = "жасы жоқ, In Progress басталмаған" if item["age_days"] is None else f"жасы {item['age_days']} күн ({item['age_hours']} сағ)"
    aged = "ескірген (1 күн және одан үлкен)" if item["aged"] else "1 күндік шектен кіші"
    return f"{item['id']} | {item['title']} | {item['status']} | {item['assignee']} | {age} | {aged}"


def render_brief(facts: dict) -> str:
    lines = [
        f"ЖОБА: {facts['project']}",
        f"ЕСЕП СӘТІ: {facts['as_of']} (белдеу {facts['timezone']})",
        f"СИПАТ: {facts['simulation']}",
        "КӨЗ: " + "; ".join(facts["sources"]),
        f"ЕСКІРУ ЕРЕЖЕСІ: ашық тапсырманың жасы {facts['rules']['aged_days']} күн және одан үлкен болса, ескірген.",
        facts["rules"]["numbers"],
        "КОМАНДА: " + "; ".join(f"{person['name']} ({person['role']})" for person in facts["team"]),
        "",
    ]
    for sprint in facts["sprints"]:
        lines.extend(
            [
                f"SPRINT {sprint['id']} | {sprint['start']} — {sprint['end']}",
                f"Мақсат: {sprint['goal']}",
                f"Мақсат мәртебесі: {sprint['goal_status']}",
                f"Ауқым: {sprint['scope_count']} тапсырма",
                f"Аяқталды: {sprint['done_count']} ({', '.join(sprint['done_ids'])})",
                f"Ауысып келген: {', '.join(sprint['carry_over']) or 'жоқ'}",
                f"Throughput: {sprint['throughput']}",
                f"Күндік throughput: {_daily_line(sprint)}",
                f"Аяқталу үлесі: {sprint['completion_pct']}%",
                f"Story Points: ауқым {sprint['sp_scope']}, аяқталғаны {sprint['sp_done']}, үлесі {sprint['sp_completion_pct']}%",
                f"Average Cycle Time, барлық аяқталған: {sprint['avg_cycle_days']} күн",
                f"P85 Cycle Time, барлық аяқталған: {sprint['p85_cycle_days']} күн",
                f"Average Cycle Time, тек осы спринтте басталған: {sprint['avg_cycle_days_new']} күн",
                f"P85 Cycle Time, тек осы спринтте басталған: {sprint['p85_cycle_days_new']} күн",
                f"WIP, күн соңындағы орташа: {sprint['wip_avg_eod']}; шыңы: {sprint['wip_peak']}",
                (
                    f"Testing: күн соңы орташа {sprint['testing_avg_eod']}; шың {sprint['testing_peak']}; "
                    f"лимит {sprint['testing_limit']}; бұзылу {sprint['testing_violations']} рет; "
                    f"лимиттен асқан уақыт {sprint['testing_over_hours']} сағ; кезеңде болу орташа {sprint['testing_avg_hours']} сағ"
                ),
                "Ашық тапсырмалар:",
            ]
        )
        if sprint["open"]:
            lines.extend(f"- {_open_line(item)}" for item in sprint["open"])
        else:
            lines.append("- жоқ")
        lines.append("Аяқталмау түсіндірмесі (шолу мәтіні, төмендегі дәлдеумен бірге оқылады):")
        lines.extend(f"- {text}" for text in sprint["not_done_explanation"])
        done = set(sprint["done_ids"])
        mentioned_done = []
        for text in sprint["not_done_explanation"]:
            for task_id in re.findall(r"CH-\d+", text):
                if task_id in done and task_id not in mentioned_done:
                    mentioned_done.append(task_id)
        if mentioned_done:
            lines.append(
                "Дәлдеу: шолу мәтінінде кездесетін мына id осы спринтте Done: "
                + ", ".join(mentioned_done)
                + ". Оларды аяқталмады деп жазба."
            )
        lines.append("Бөгеттер:")
        for item in sprint["impediments"]:
            lines.append(f"- {item['text']} Тапсырма: {', '.join(item['tasks'])}. Иесі: {item['owner']}.")
        if sprint["defects"]:
            lines.append("Ақау жазбалары (тарихтан):")
            for defect in sprint["defects"]:
                lines.append(f"- {defect['id']} {defect['at']}: {defect['note']}")
        lines.append("")

    retro = facts["retro_action"]
    achieved = "мақсат орындалды" if retro["achieved"] else "мақсат орындалмады"
    lines.extend(
        [
            (
                f"РЕТРО ӘРЕКЕТ {retro['id']}: {retro['metric']}. "
                f"Бұрын {retro['before']}, кейін {retro['after']}, азаю {retro['reduction_pct']}%, "
                f"мақсат {retro['target_pct']}% және одан жоғары. {achieved}."
            ),
            f"Rework саны: Sprint 1 = {facts['rework']['sprint_1']}, Sprint 2 = {facts['rework']['sprint_2']}.",
            (
                "Testing → Done ауысуына әзірлеушінің қатысу үлесі: "
                f"Sprint 1 = {facts['cross_testing_pct']['sprint_1']}%, "
                f"Sprint 2 = {facts['cross_testing_pct']['sprint_2']}%."
            ),
            "",
            "РЕПОЗИТОРИЙ:",
            f"Санақтың көзі: {facts['repository']['use_count_from']}",
        ]
    )
    for window in facts["repository"]["windows"]:
        lines.append(f"- Sprint {window['sprint']} терезесінде жергілікті git коммиті: {window['local_git_commits']}")
    api = facts["repository"]["github_api"]
    if api.get("error"):
        lines.append(f"GitHub API: {api['error']}")
    else:
        lines.append(f"GitHub API репозиторийі: {api['slug']}")
        for window in api["windows"]:
            if window["ok"]:
                lines.append(
                    f"- Sprint {window['sprint']} API коммит саны: {window['count']} (HTTP {window['status']})"
                )
            else:
                lines.append(f"- Sprint {window['sprint']} API қатесі: {window['error']}. Бұл нөл коммит емес.")
    lines.append("Жергілікті коммиттер (күні мен тақырыбы, спринт терезесіне кірмейтінін жоғарыдағы санақ көрсетеді):")
    for row in facts["repository"]["local_commits_outside_sprint_windows"]:
        lines.append(f"- {row['at']} {row['sha']} {row['subject']}")
    nxt = facts["next_action"]
    lines.extend(
        [
            "",
            f"КЕЛЕСІ ӘРЕКЕТ (даяр факт): {nxt['text']} Иесі: {nxt['owner']}. Мерзімі: {nxt['due']}.",
            "Басқа мерзім, басқа ие, басқа пайыз BRIEF-те жоқ.",
        ]
    )
    text = "\n".join(lines) + "\n"
    assert_no_secrets(text)
    return text
