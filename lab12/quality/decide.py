"""Жүргізуден бұрын бекітілген қабылдау ережесі."""

from __future__ import annotations


def suggestion_pilot(report: dict, bars: dict) -> bool:
    rule = bars["suggestion_pilot"]
    return (
        report["macro_f1"] >= rule["macro_f1_min"]
        and report["per_label"]["reject"]["recall"] >= rule["reject_recall_min"]
        and report["invalid_rate"] <= rule["invalid_rate_max"]
    )


def auto_publish_allowed(bars: dict) -> bool:
    return bool(bars["auto_publish"]["allowed"])
