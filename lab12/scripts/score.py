#!/usr/bin/env python3
"""Шикі жауапты эталонмен салыстырады. Модельді қайта шақырмайды."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(LAB))

from quality.decide import suggestion_pilot  # noqa: E402
from quality.metrics import by_language, score_actions  # noqa: E402
from quality.prompts import parse_action  # noqa: E402


def load_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def score_version(version: str, gold_examples: list[dict], labels: list[str]) -> dict:
    raw_rows = load_jsonl(LAB / "output" / f"raw-{version}.jsonl")
    by_id = {row["id"]: row for row in raw_rows}
    missing = [item["id"] for item in gold_examples if item["id"] not in by_id]
    if missing:
        raise SystemExit(f"{version}: жоқ жауаптар: {', '.join(missing)}")
    joined = []
    for example in gold_examples:
        raw = by_id[example["id"]]
        action = parse_action(raw["raw"])
        joined.append(
            {
                "id": example["id"],
                "language": example["language"],
                "gold_action": example["gold_action"],
                "action": action,
                "raw": raw["raw"],
                "latency_ms": raw["latency_ms"],
                "input_tokens_o200k": raw["input_tokens_o200k"],
                "output_tokens_o200k": raw["output_tokens_o200k"],
                "model": raw["model"],
            }
        )
    metrics = score_actions(
        [row["gold_action"] for row in joined],
        [row["action"] for row in joined],
        labels,
    )
    metrics["by_language"] = by_language(joined, labels)
    latencies = sorted(row["latency_ms"] for row in joined)
    mid = latencies[len(latencies) // 2]
    p95_index = min(len(latencies) - 1, round(0.95 * (len(latencies) - 1)))
    metrics["model"] = joined[0]["model"]
    metrics["mean_latency_ms"] = round(sum(latencies) / len(latencies))
    metrics["median_latency_ms"] = mid
    metrics["p95_latency_ms"] = latencies[p95_index]
    metrics["mean_input_tokens"] = sum(row["input_tokens_o200k"] for row in joined) / len(joined)
    metrics["mean_output_tokens"] = sum(row["output_tokens_o200k"] for row in joined) / len(joined)
    metrics["rows"] = [
        {
            "id": row["id"],
            "language": row["language"],
            "gold_action": row["gold_action"],
            "action": row["action"],
            "latency_ms": row["latency_ms"],
        }
        for row in joined
    ]
    return metrics


def main() -> int:
    gold_path = LAB / "data" / "eval-set.json"
    gold_bytes = gold_path.read_bytes()
    gold = json.loads(gold_bytes)
    bars = json.loads((LAB / "data" / "acceptance.json").read_text(encoding="utf-8"))
    labels = bars["labels"]
    versions = {}
    for version in ("v1", "v2"):
        versions[version] = score_version(version, gold["examples"], labels)
        versions[version]["suggestion_pilot"] = suggestion_pilot(versions[version], bars)

    report = {
        "eval_set_sha256": hashlib.sha256(gold_bytes).hexdigest(),
        "n": len(gold["examples"]),
        "acceptance": bars,
        "versions": versions,
    }
    destination = LAB / "output" / "eval-results.json"
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    candidate = versions["v2"]
    print(
        "v2 accuracy={accuracy:.3f} macro_f1={macro_f1:.3f} reject_recall={recall:.3f} pilot={pilot}".format(
            accuracy=candidate["accuracy"],
            macro_f1=candidate["macro_f1"],
            recall=candidate["per_label"]["reject"]["recall"],
            pilot=candidate["suggestion_pilot"],
        )
    )
    print(f"Жазылды: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
