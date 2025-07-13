# Rules Central

Rules Central is a Flask web application for managing and visualizing rule sets.
Upload diagrams, explore rule hierarchies and collaborate with your team all in one place.

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

- **In‑app help overlay** (press `Shift+/`)
- **Contact page** for sending feedback

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
The compiled stylesheet is saved to `static/css/app.css` and includes autoprefixing and minification. The legacy `main.css` has been removed.

## Running Locally
Start the development server with:
```bash
export FLASK_ENV=development
python app.py
```
Then open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.
Visit [/about](http://127.0.0.1:8080/about) for version info and links.
Press `Shift+/` at any time to open the built‑in help overlay.

## Running Tests
Run the unit tests with:
```bash
pytest -v
```
The tests cover helper functions in [utils.py](utils.py) and ensure the application factory can be imported without optional dependencies.

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
- `routes/` – blueprints and route handlers
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
