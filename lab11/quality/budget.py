"""8-аптадағы SLO формуласы. Сан қайта есептеледі, қолмен жазылмайды."""

from __future__ import annotations

from decimal import Decimal


def minutes_in_month(days: int) -> int:
    if days not in (28, 29, 30, 31):
        raise ValueError("days must be a calendar month length")
    return days * 24 * 60


def error_budget_minutes(days: int, slo: float) -> float:
    ratio = Decimal(str(slo))
    if not Decimal(0) < ratio < Decimal(1):
        raise ValueError("slo must be a fraction such as 0.999")
    budget = Decimal(minutes_in_month(days)) * (Decimal(1) - ratio)
    return float(budget)


def burn_ratio(downtime_minutes: float, budget_minutes: float) -> float:
    if budget_minutes <= 0:
        raise ValueError("budget must be positive")
    return downtime_minutes / budget_minutes


def fast_burn(downtime_minutes: float, budget_minutes: float, window_minutes: float = 60) -> bool:
    """1 сағатта бюджеттің 2%-ы жанса, жылдам жану."""
    if window_minutes <= 0:
        raise ValueError("window must be positive")
    return downtime_minutes >= budget_minutes * 0.02
