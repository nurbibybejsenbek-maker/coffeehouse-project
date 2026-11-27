"""Жергілікті Ollama. Сыртқы модельге BRIEF кетпейді."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

DEFAULT_MODEL = "qwen2.5:3b"
HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")


def chat(model: str, system: str, user: str) -> tuple[str, int, str, dict]:
    body = json.dumps(
        {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "options": {"temperature": 0, "num_predict": 2500, "num_ctx": 8192},
        }
    ).encode()
    request = urllib.request.Request(
        f"{HOST}/api/chat",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            payload = json.loads(response.read().decode())
    except urllib.error.URLError as error:
        raise RuntimeError(f"Ollama қолжетімсіз ({HOST}): {error}") from error
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    content = payload.get("message", {}).get("content", "")
    reported = payload.get("model") or model
    meta = {
        "done_reason": payload.get("done_reason"),
        "eval_count": payload.get("eval_count"),
        "prompt_eval_count": payload.get("prompt_eval_count"),
    }
    return content, elapsed_ms, reported, meta
