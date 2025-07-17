# Rules Central

Rules Central is a Flask web application that helps you organize and visualize complex rule sets with ease.
Upload diagrams, explore relationships and collaborate with your team in one streamlined environment.
The interface ships with a **Bear‑inspired theme** for a cohesive macOS look and feel.
The dashboard UI now includes animated metrics cards and a handy back‑to‑top button for easier navigation.
It consolidates diagrams, rule definitions and statistics into a single dashboard.

## Quick Start
1. Install Python requirements:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Build the CSS assets:
   ```bash
   npm install
   npm run build:css
   ```
3. Launch the app:
   ```bash
   export FLASK_ENV=development
   python app.py
   ```
4. Open <http://127.0.0.1:8080> in your browser and start exploring.
   Use `npm run watch:css` during development to automatically rebuild styles.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Custom configuration](#custom-configuration)
- [Project structure](#project-structure)
- [Codespaces](#codespaces)
- [License](#license)

## Features
- **Dashboard** with live metrics
- **Upload** diagrams with validation
- **Search** and explore stored rules
- **API utility** for testing rules
- **About** page with version info and documentation links
- **Theme toggle** cycles through Bear, Dark and Light modes
- **High contrast** option for improved accessibility
- **Enhanced styling** with gradients, glass cards and focus rings
- **First-time user tour** with contextual tips
- **Breadcrumb navigation** for easier orientation
- **Contact page** with floating feedback button for quick responses
- **Help overlay** accessible with `Shift+/`

## Requirements
- Python 3.10+
- Node.js for building Tailwind CSS assets

## Setup
Create a virtual environment and install the Python dependencies (or install the package in editable mode):
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# or
pip install -e .
```
`python-dotenv` is optional. If it is not installed, the application will log a warning but still run.

Build CSS assets:
```bash
npm install
npm run build:css
```
The compiled stylesheet is saved to `static/css/output.css` and includes autoprefixing and minification. The new Bear theme uses Tailwind v3 with JIT.
Note: the optional `pa11y-ci` accessibility audit has been removed from `package.json` to avoid install errors. The `audit:a11y` npm script now simply prints a placeholder message.

## Running Locally
Start the development server with:
```bash
export FLASK_ENV=development
python app.py
```
Then open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.
Visit [/about](http://127.0.0.1:8080/about) for version info and links.
Press `Shift+/` at any time to open the built‑in help overlay.
For a production-like environment you can run the Waitress server:
```bash
python wsgi.py
```

## Running Tests
Run the unit tests with:
```bash
pytest -v
```
The test suite exercises the application factory and a wide range of utilities in the `utils` module, including diagram generation helpers.

### Custom configuration
Set the ``CONFIG_PATH`` environment variable to load an alternative
``config.json`` file when running the app or tests:
```bash
export CONFIG_PATH=/path/to/config.json
```

Additional environment variables:

- `SECRET_KEY` – override the generated secret key
- `UPLOAD_FOLDER` – directory for uploaded files
- `DIAGRAMS_FOLDER` – directory for generated diagrams
- `PORT` – port for `wsgi.py` when run directly

## Project structure
- `app.py` – application factory
- `wsgi.py` – WSGI entry point for production servers
- `service.py` – Windows service wrapper
- `routes/` – all blueprints live in `routes/core.py` with additional routes in `all_routes.py`.
- The diagrams viewer and converter remain under the `diagrams` blueprint in `core.py`.
- `templates/` – Jinja2 templates
- `static/` – static assets
- `config/` – default configuration files
- `tests/` – pytest unit tests

## Codespaces

This project includes a development container configuration for GitHub Codespaces. The container installs Python dependencies and builds the CSS assets for you. Once the container is ready, start the app with:
```bash
python app.py
```
The site will be available at http://127.0.0.1:8080.

## Documentation

Full usage guides and API references are available at [http://127.0.0.1:8080/full-help](http://127.0.0.1:8080/full-help).
For quick tips while browsing the site press `Shift+/` to open the help menu.

## License
This project is provided as‑is without warranty.
