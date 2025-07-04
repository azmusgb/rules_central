from pathlib import Path
from setuptools import setup, find_packages

BASE_DIR = Path(__file__).parent
README = (BASE_DIR / "README.md").read_text(encoding="utf-8")

setup(
    name="rules_central",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "flask",
        "flask-sqlalchemy",
    ],
    long_description=README,
    long_description_content_type="text/markdown",
)
