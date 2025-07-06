"""WSGI entry point for production servers."""

import os

from app import app as application

__all__ = ["application"]

if __name__ == "__main__":
    # Run with Flask's development server when executed directly.
    port = int(os.environ.get("PORT", 5000))
    application.run(port=port)
