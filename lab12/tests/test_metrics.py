from quality.decide import auto_publish_allowed, suggestion_pilot
from quality.metrics import score_actions


def test_perfect_run_is_all_ones():
    labels = ["publish", "hold", "reject"]
    gold = ["publish", "hold", "reject"]
    report = score_actions(gold, gold, labels)
    assert report["accuracy"] == 1
    assert report["macro_f1"] == 1
    assert report["invalid_rate"] == 0
    assert report["per_label"]["reject"]["recall"] == 1


def test_invalid_json_is_a_miss_not_a_fourth_label():
    labels = ["publish", "hold", "reject"]
    report = score_actions(["reject", "publish"], [None, "publish"], labels)
    assert report["invalid"] == 1
    assert report["correct"] == 1
    assert report["per_label"]["reject"]["fn"] == 1
    assert report["per_label"]["reject"]["recall"] == 0


def test_bars_reject_a_weak_reject_recall():
    bars = {
        "suggestion_pilot": {
            "macro_f1_min": 0.7,
            "reject_recall_min": 0.8,
            "invalid_rate_max": 0.1,
        },
        "auto_publish": {"allowed": False},
    }
    labels = ["publish", "hold", "reject"]
    gold = ["reject"] * 5 + ["publish"] * 5
    pred = ["publish"] * 10
    report = score_actions(gold, pred, labels)
    assert report["per_label"]["reject"]["recall"] == 0
    assert suggestion_pilot(report, bars) is False
    assert auto_publish_allowed(bars) is False
