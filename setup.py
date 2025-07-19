"""Packaging script for Rules Central.

This script handles the packaging and distribution of the Rules Central package
using setuptools. It reads package metadata, dependencies, and other configuration
from the project files.
"""

from pathlib import Path
from setuptools import setup, find_packages

# Constants
PACKAGE_NAME = "rules_central"
BASE_DIR = Path(__file__).parent


def parse_requirements(path: Path) -> list[str]:
    """Return a clean list of requirements from the given file.
    
    Args:
        path: Path to the requirements file.
        
    Returns:
        List of requirement strings with comments and empty lines removed.
    """
    with path.open(encoding="utf-8") as req:
        return [
            line.strip() 
            for line in req 
            if line.strip() and not line.startswith(("#", "-"))
        ]


def get_long_description() -> str:
    """Read the long description from the README file.
    
    Returns:
        Content of README.md as a string.
    """
    readme_path = BASE_DIR / "README.md"
    return readme_path.read_text(encoding="utf-8")


def main() -> None:
    """Package the project using setuptools."""
    setup(
        name=PACKAGE_NAME,
        version="0.1.0",  # Using semantic versioning
        packages=find_packages(exclude=["tests*"]),
        install_requires=parse_requirements(BASE_DIR / "requirements.txt"),
        python_requires=">=3.8",  # Specify minimum Python version
        long_description=get_long_description(),
        long_description_content_type="text/markdown",
        include_package_data=True,  # Include non-Python files specified in MANIFEST.in
        # Additional metadata
        author="Your Name",
        author_email="your.email@example.com",
        description="Centralized rules management system",
        license="MIT",
        url="https://github.com/yourusername/rules-central",
        classifiers=[
            "Development Status :: 3 - Alpha",
            "Intended Audience :: Developers",
            "License :: OSI Approved :: MIT License",
            "Programming Language :: Python :: 3",
            "Programming Language :: Python :: 3.8",
            "Programming Language :: Python :: 3.9",
            "Programming Language :: Python :: 3.10",
            "Programming Language :: Python :: 3.11",
        ],
    )


if __name__ == "__main__":
    main()