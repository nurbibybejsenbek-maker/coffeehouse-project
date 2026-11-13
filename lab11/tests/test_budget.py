from quality.budget import burn_ratio, error_budget_minutes, fast_burn


def test_order_budget_matches_week8():
    assert error_budget_minutes(30, 0.999) == 43.2
    assert error_budget_minutes(30, 0.9995) == 21.6


def test_incident_burns_a_third_of_the_order_budget():
    budget = error_budget_minutes(30, 0.999)
    assert round(burn_ratio(14, budget), 3) == 0.324
    assert fast_burn(14, budget)
