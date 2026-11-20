#!/usr/bin/env python3
"""Өлшенген орташа токеннен айлық құн мен GPU теңесу нүктесін шығарады."""

from __future__ import annotations

import json
import sys
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(LAB))

from quality.cost import (  # noqa: E402
    break_even_requests,
    gpu_month_usd,
    monthly_api_usd,
    request_cost_usd,
    review_volume,
)


def scenario(name, requests, input_tokens, output_tokens, price_in, price_out, gpu_month):
    per_request = request_cost_usd(input_tokens, output_tokens, price_in, price_out)
    month = monthly_api_usd(requests, input_tokens, output_tokens, price_in, price_out)
    return {
        "name": name,
        "requests": requests,
        "mean_input_tokens": input_tokens,
        "mean_output_tokens": output_tokens,
        "usd_per_request": per_request,
        "api_usd_month": month,
        "gpu_usd_month": gpu_month,
        "api_cheaper": month < gpu_month,
        "break_even_requests": break_even_requests(gpu_month, per_request),
    }


def main() -> int:
    tariffs = json.loads((LAB / "data" / "tariffs.json").read_text(encoding="utf-8"))
    results = json.loads((LAB / "output" / "eval-results.json").read_text(encoding="utf-8"))
    candidate = results["versions"]["v2"]
    price = tariffs["commercial"]
    gpu = tariffs["gpu"]
    hours = tariffs["hours_per_month"]
    secure = gpu_month_usd(gpu["secure_usd_per_hour"], hours)
    community = gpu_month_usd(gpu["community_usd_per_hour"], hours)
    base = review_volume(tariffs["orders_month_12"], tariffs["review_rate"], 1)
    times_ten = review_volume(tariffs["orders_month_12"], tariffs["review_rate"], 10)
    fx = tariffs["fx_kzt_per_usd"]

    def pack(multiplier_name, requests, price_in, price_out, model):
        row = scenario(
            multiplier_name,
            requests,
            candidate["mean_input_tokens"],
            candidate["mean_output_tokens"],
            price_in,
            price_out,
            secure,
        )
        row["model"] = model
        row["api_kzt_month"] = row["api_usd_month"] * fx
        row["gpu_secure_kzt_month"] = secure * fx
        row["gpu_community_usd_month"] = community
        return row

    report = {
        "priced_on": tariffs["priced_on"],
        "token_source": "v2 жүгіртуіндегі әр сұраныстың tiktoken o200k есебінің орташасы",
        "output_token_note": "Шығыс токені жергілікті модельдің JSON жауабы. Ақылы API шақырылмады, ұзындық сол жауаптан алынды.",
        "volume": {
            "orders_month_12": tariffs["orders_month_12"],
            "review_rate": tariffs["review_rate"],
            "base_reviews": base,
            "times_10_reviews": times_ten,
        },
        "gpt_4_1_mini": {
            "base": pack("base", base, price["input_per_mtok"], price["output_per_mtok"], price["model"]),
            "times_10": pack("times_10", times_ten, price["input_per_mtok"], price["output_per_mtok"], price["model"]),
        },
        "gpt_4o_mini_sensitivity": {
            "base": pack(
                "base",
                base,
                price["sensitivity"]["input_per_mtok"],
                price["sensitivity"]["output_per_mtok"],
                price["sensitivity"]["model"],
            ),
            "times_10": pack(
                "times_10",
                times_ten,
                price["sensitivity"]["input_per_mtok"],
                price["sensitivity"]["output_per_mtok"],
                price["sensitivity"]["model"],
            ),
        },
        "gpu_secure_usd_month": secure,
        "gpu_community_usd_month": community,
        "sources": {
            "openai": price["source"],
            "runpod": gpu["source"],
        },
    }
    destination = LAB / "output" / "cost.json"
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    base_row = report["gpt_4_1_mini"]["base"]
    print(
        f"API base ${base_row['api_usd_month']:.4f} / ай, "
        f"GPU secure ${secure:.2f} / ай, "
        f"теңесу {base_row['break_even_requests']:.0f} сұраныс/ай"
    )
    print(f"Жазылды: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
