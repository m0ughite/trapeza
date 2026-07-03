"""Trapeza Python solver service — CP-SAT Tier-1 + Monte Carlo twin.

Pure numeric/optimization work lives here (Amendment 3): TypeScript is
single-threaded and the wrong tool for the constraint-optimization core, so the
CP-SAT solver and the compute-heavy Monte Carlo simulation are Python.
"""

__all__ = ["__version__"]
__version__ = "0.1.0"
