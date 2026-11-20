from quality.cost import (
    break_even_requests,
    gpu_month_usd,
    monthly_api_usd,
    review_volume,
)


def test_volume_uses_week8_orders():
    assert review_volume(6480, 0.08) == 518.4
    assert review_volume(6480, 0.08, 10) == 5184


def test_gpu_month_is_hourly_times_730():
    assert gpu_month_usd(0.50, 730) == 365
    assert gpu_month_usd(0.22, 730) == 160.6


def test_break_even_is_gpu_divided_by_request():
    month = monthly_api_usd(518.4, 1000, 20, 0.40, 1.60)
    per_request = month / 518.4
    assert break_even_requests(365, per_request) == 365 / per_request
