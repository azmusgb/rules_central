# Rules Central

Rules Central is a Flask application for managing and visualizing rule sets.
It provides tools to upload diagrams, analyze rules, and collaborate with others.

## Features
- **Dashboard** with live metrics
- **Upload** diagrams with validation
- **Search** and explore stored rules
- **API utility** for testing rules

## Requirements
- Python 3.10+
- Node.js for building Tailwind CSS assets

Install Python dependencies (or install the package in editable mode):
```bash
pip install -r requirements.txt
# or
pip install -e .
```

Build CSS assets (optional):
```bash
npm install
npm run build:css
```

## Running locally
Use Flask's built‑in server to start the app:
```bash
python app.py
```
Then open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.

### Custom configuration
Set the ``CONFIG_PATH`` environment variable to load an alternative
``config.json`` file when running the app or tests.

## Project structure
- `app.py` – application factory
- `routes/` – blueprints and route handlers
- `services/` – backend services
- `templates/` – Jinja2 templates
- `static/` – static assets

## License
This project is provided as‑is without warranty.
