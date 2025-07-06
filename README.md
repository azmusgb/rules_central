# Rules Central

Rules Central is a Flask application for managing and visualizing rule sets.
It provides tools to upload diagrams, analyze rules, and collaborate with others.

## Features
- **Dashboard** with live metrics
- **Upload** diagrams with validation
- **Search** and explore stored rules
- **API utility** for testing rules
- **About** page with version info and documentation links
- **Clean typography** using custom fonts

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
Start the development server with:
```bash
python app.py
```
Then open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.
Visit [/about](http://127.0.0.1:8080/about) for version info and links.

### Custom configuration
Set the ``CONFIG_PATH`` environment variable to load an alternative
``config.json`` file when running the app or tests:
```bash
export CONFIG_PATH=/path/to/config.json
```

## Project structure
- `app.py` – application factory
- `routes/` – blueprints and route handlers
- `templates/` – Jinja2 templates
- `static/` – static assets

## Codespaces

This project includes a development container configuration for GitHub Codespaces. The container installs Python dependencies and builds the CSS assets for you. Once the container is ready, start the app with:
```bash
python app.py
```
The site will be available at http://127.0.0.1:8080.

## License
This project is provided as‑is without warranty.
