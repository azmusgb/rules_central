"""Packaging script for Rules Central."""

from pathlib import Path
from setuptools import setup, find_packages


def parse_requirements(path: Path) -> list[str]:
    """Return a clean list of requirements from the given file."""

    with path.open() as req:
        return [
            line.strip()
            for line in req
            if line.strip() and not line.startswith("#")
        ]

BASE_DIR = Path(__file__).parent
README = (BASE_DIR / "README.md").read_text(encoding="utf-8")

def main() -> None:
    """Package the project using :mod:`setuptools`."""
    setup(
        name="rules_central",
        version="0.1",
        packages=find_packages(),
        install_requires=parse_requirements(BASE_DIR / "requirements.txt"),
        long_description=README,
        long_description_content_type="text/markdown",
    )


if __name__ == "__main__":
    main()
