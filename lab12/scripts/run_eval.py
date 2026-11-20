#!/usr/bin/env python3
"""Ollama арқылы eval-жиынтықты жүгіртеді. Төлем жоқ, модель жергілікті."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(LAB))

from quality.prompts import messages_for  # noqa: E402
from quality.tokens import count_messages, count_text  # noqa: E402

DEFAULT_MODEL = "qwen2.5:3b"
HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")


def chat(model: str, messages: list[dict[str, str]]) -> tuple[str, int]:
    body = json.dumps(
        {
            "model": model,
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0, "num_predict": 80},
        }
    ).encode()
    request = urllib.request.Request(
        f"{HOST}/api/chat",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=180) as response:
        payload = json.loads(response.read().decode())
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    content = payload.get("message", {}).get("content", "")
    return content, elapsed_ms


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", choices=("v1", "v2"), required=True)
    parser.add_argument("--model", default=os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL))
    args = parser.parse_args()

    gold = json.loads((LAB / "data" / "eval-set.json").read_text(encoding="utf-8"))
    out_dir = LAB / "output"
    out_dir.mkdir(exist_ok=True)
    destination = out_dir / f"raw-{args.prompt}.jsonl"

    rows = []
    for index, example in enumerate(gold["examples"], start=1):
        messages = messages_for(example, args.prompt)
        try:
            raw, latency_ms = chat(args.model, messages)
        except urllib.error.URLError as error:
            print(f"Ollama қолжетімсіз: {error}", file=sys.stderr)
            return 1
        rows.append(
            {
                "id": example["id"],
                "prompt": args.prompt,
                "model": args.model,
                "raw": raw,
                "latency_ms": latency_ms,
                "input_tokens_o200k": count_messages(messages),
                "output_tokens_o200k": count_text(raw),
            }
        )
        print(f"{args.prompt} {index:02d}/{len(gold['examples'])} {example['id']} {latency_ms} ms")

    with destination.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Жазылды: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
