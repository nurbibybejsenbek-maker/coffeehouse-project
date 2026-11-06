#!/usr/bin/env python3
"""main бұтағының қорғау ережесін GitHub API арқылы қояды.

Токенды файлға жазбайды. Кезек: GITHUB_TOKEN / GH_TOKEN, содан кейін
origin URL ішіндегі ghp_/github_pat_ кілті (бар болса). Кілт басып шығарылмайды.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
REPO = LAB.parent
SPEC = LAB / "branch-protection.json"


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
    if not token:
        raise SystemExit("GITHUB_TOKEN жоқ. Қорғауды қою үшін әкімші токені керек.")
    return match.group("owner"), match.group("repo"), token


def main() -> None:
    owner, repo, token = repo_coords()
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    body = {
        "required_status_checks": spec["required_status_checks"],
        "enforce_admins": spec["enforce_admins"],
        "required_pull_request_reviews": spec["required_pull_request_reviews"],
        "restrictions": spec["restrictions"],
        "required_linear_history": spec["required_linear_history"],
        "allow_force_pushes": spec["allow_force_pushes"],
        "allow_deletions": spec["allow_deletions"],
        "block_creations": spec["block_creations"],
        "required_conversation_resolution": spec["required_conversation_resolution"],
        "lock_branch": spec["lock_branch"],
        "allow_fork_syncing": spec["allow_fork_syncing"],
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/branches/{spec['branch']}/protection"
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "coffeehouse-lab10",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        detail = error.read().decode()[:800]
        raise SystemExit(f"GitHub API {error.code}: {detail}") from error

    checks = (payload.get("required_status_checks") or {}).get("contexts")
    reviews = payload.get("required_pull_request_reviews") or {}
    print(
        json.dumps(
            {
                "branch": spec["branch"],
                "enforce_admins": (payload.get("enforce_admins") or {}).get("enabled"),
                "approving_review_count": reviews.get("required_approving_review_count"),
                "dismiss_stale_reviews": reviews.get("dismiss_stale_reviews"),
                "required_status_checks": checks,
                "strict": (payload.get("required_status_checks") or {}).get("strict"),
                "allow_force_pushes": (payload.get("allow_force_pushes") or {}).get("enabled"),
                "required_conversation_resolution": (
                    payload.get("required_conversation_resolution") or {}
                ).get("enabled"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
