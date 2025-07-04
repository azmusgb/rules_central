"""WSGI entry point for production servers."""

from app import app

if __name__ == "__main__":
    # Run with Flask's development server when executed directly.
    app.run()
