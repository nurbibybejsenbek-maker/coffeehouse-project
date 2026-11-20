"""Қағаз жүзіндегі құн: сұраныс саны × токен × жария тариф."""

from __future__ import annotations


def review_volume(orders: float, rate: float, multiplier: float = 1.0) -> float:
    return orders * rate * multiplier


def request_cost_usd(
    input_tokens: float,
    output_tokens: float,
    input_per_mtok: float,
    output_per_mtok: float,
) -> float:
    return input_tokens / 1_000_000 * input_per_mtok + output_tokens / 1_000_000 * output_per_mtok


def monthly_api_usd(
    requests: float,
    input_tokens: float,
    output_tokens: float,
    input_per_mtok: float,
    output_per_mtok: float,
) -> float:
    return requests * request_cost_usd(
        input_tokens, output_tokens, input_per_mtok, output_per_mtok
    )


def gpu_month_usd(hourly: float, hours: float) -> float:
    return hourly * hours


def break_even_requests(gpu_month: float, cost_per_request: float) -> float:
    if cost_per_request <= 0:
        raise ValueError("сұраныс құны оң болуы керек")
    return gpu_month / cost_per_request
