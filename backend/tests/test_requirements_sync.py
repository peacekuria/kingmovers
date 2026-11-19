from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _deps(path):
    lines = (l.strip() for l in path.read_text().splitlines())
    return sorted(l for l in lines if l and not l.startswith("#"))


def test_vercel_requirements_match_backend():
    """Vercel installs from the root requirements.txt; Docker/CI from backend/. Keep them identical."""
    assert _deps(ROOT / "requirements.txt") == _deps(ROOT / "backend" / "requirements.txt")
