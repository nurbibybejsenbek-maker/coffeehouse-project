"""Әрекет белгісі бойынша дәлдік, precision, recall, F1."""

from __future__ import annotations


def confusion(gold: list[str], pred: list[str], label: str) -> dict[str, int]:
    tp = fp = fn = 0
    for truth, guess in zip(gold, pred, strict=True):
        if guess == label and truth == label:
            tp += 1
        elif guess == label and truth != label:
            fp += 1
        elif truth == label and guess != label:
            fn += 1
    return {"tp": tp, "fp": fp, "fn": fn}


def prf(counts: dict[str, int]) -> dict[str, float]:
    tp, fp, fn = counts["tp"], counts["fp"], counts["fn"]
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"precision": precision, "recall": recall, "f1": f1}


def score_actions(gold: list[str], pred: list[str | None], labels: list[str]) -> dict:
    if len(gold) != len(pred):
        raise ValueError("gold және pred ұзындығы бірдей болуы керек")
    guessed = [item if item in labels else "invalid" for item in pred]
    invalid = sum(item == "invalid" for item in guessed)
    per_label = {}
    for label in labels:
        stats = prf(confusion(gold, guessed, label))
        stats.update(confusion(gold, guessed, label))
        per_label[label] = stats
    correct = sum(truth == guess for truth, guess in zip(gold, guessed, strict=True))
    macro_f1 = sum(item["f1"] for item in per_label.values()) / len(labels)
    return {
        "n": len(gold),
        "correct": correct,
        "accuracy": correct / len(gold) if gold else 0.0,
        "macro_f1": macro_f1,
        "invalid": invalid,
        "invalid_rate": invalid / len(gold) if gold else 0.0,
        "per_label": per_label,
    }


def by_language(
    rows: list[dict], labels: list[str], language_key: str = "language"
) -> dict[str, dict]:
    grouped: dict[str, list[dict]] = {}
    for row in rows:
        grouped.setdefault(row[language_key], []).append(row)
    return {
        language: score_actions(
            [row["gold_action"] for row in items],
            [row.get("action") for row in items],
            labels,
        )
        for language, items in sorted(grouped.items())
    }
