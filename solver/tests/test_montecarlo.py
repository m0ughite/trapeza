"""Monte Carlo twin tests — statistical, reproducible."""

import json

from trapeza_solver.contract import CONTRACT_DIR, SimulateRequest
from trapeza_solver.montecarlo import simulate


def _example() -> SimulateRequest:
    data = json.loads((CONTRACT_DIR / "examples" / "simulate-request.json").read_text())
    return SimulateRequest.model_validate(data)


def test_reproducible_under_seed():
    req = _example()
    a = simulate(req)
    b = simulate(req)
    assert a == b


def test_failure_probability_in_range_and_plausible():
    req = _example()
    res = simulate(req)
    # p1 ~ Beta(19,3) ~ 0.86, p2 ~ Beta(18,4) ~ 0.82, chained => workflow success
    # ~0.70 => failure ~0.30. Assert it is a sane, non-degenerate probability.
    assert 0.0 <= res["failureProbability"] <= 1.0
    assert 0.1 < res["failureProbability"] < 0.5
    assert res["iterations"] == req.iterations
    assert res["seed"] == req.seed


def test_higher_beta_means_more_failures():
    good = _example()
    res_good = simulate(good)
    bad = _example()
    for p in bad.providers:
        p.successAlpha, p.successBeta = 2.0, 18.0  # ~0.10 success
    res_bad = simulate(bad)
    assert res_bad["failureProbability"] > res_good["failureProbability"]
