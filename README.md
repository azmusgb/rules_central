
# Rules Central

![Rules Central Dashboard](static/images/dashboard-preview.png)

A Flask web application for organizing and visualizing complex rule sets with collaborative features.

## Key Features

- **Interactive Dashboard** with animated metrics
- **Diagram Management** with validation and conversion
- **Advanced Search** across rules and diagrams
- **Catalog Categories** for quick browsing
- **Developer API** for rule testing
- **Multi-theme Support** (Bear, Dark, Light, High Contrast)
- **Bear Light** theme refreshed for a brighter look
- **Accessibility** focused design
- **Help System** (`Shift+/` shortcut)
- **Documentation Reading Progress** for orientation
- **Unified Toast Notifications** across tools

## Quick Start

```bash
# Set up environment (Python 3.10+, Node.js 16+ recommended)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Build assets
npm install
npm run build:css
npm run build:js

# Launch development server
export FLASK_ENV=development
python app.py
```

Open http://127.0.0.1:8080 in your browser.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

## Requirements

- Python 3.10+
- Node.js 16+
- PostgreSQL (recommended for production)

## Installation

1. Clone repository
2. Set up virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   npm install
   npm run build:css
   npm run build:js
   ```

## Development

```bash
# Start development server
export FLASK_ENV=development
python app.py

# Watch CSS changes
npm run watch:css
```

Development server runs at http://127.0.0.1:8080

## Styling

The interface uses Tailwind CSS with the DaisyUI plugin. After
modifying `tailwind.config.cjs` or any files in `src/css/`, rebuild the
stylesheet:

```bash
npm run build:css
npm run build:js
```

Page level styles now live in two files:
`src/css/pages_common.css` and `src/css/pages_catalog.css`.

## Testing

Run the test suite with:
```bash
pytest -v
```

Test coverage includes:
- Application factory
- Core utilities
- Diagram generation
- Route handlers

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CONFIG_PATH` | Path to config file | `config/default.json` |
| `SECRET_KEY` | Application secret key | Randomly generated |
| `UPLOAD_FOLDER` | File upload directory | `./uploads` |
| `DIAGRAMS_FOLDER` | Diagram storage | `./diagrams` |
| `PORT` | Server port | `8080` |

## Deployment

Production-ready WSGI server:
```bash
python wsgi.py
```

Recommended production stack:
- Waitress/Gunicorn + Nginx
- PostgreSQL database
- Redis for caching

## Project Structure

```
.
├── app.py                # Application factory
├── wsgi.py               # Production entry point
├── routes/               # All application routes
│   └── core.py           # All routes (auto-discovered)
├── static/               # Static assets
├── templates/            # Jinja2 templates
├── config/               # Configuration files
└── tests/                # Test suite
```

## Routes

Key page endpoints:

- `/catalog` – browse the diagram catalog
- `/api-test` – API test utility
- `/rules-extraction` – FormWorks extraction tool
- `/markdown-notes` – markdown notes demo
- `/get-started` – quick start guide
- `/hierarchy_viewer/<root>/<file>` – hierarchy viewer
- `/dashboard` – dashboard alias
- `/home` – marketing homepage
- `/rule/<id>` – rule details

## Documentation

- Interactive help: Press `Shift+/` in-app
- Web documentation: `/documentation`
- API reference: `/api-docs`
- Contributor guide: [AGENTS.md](AGENTS.md)

## Contributing

Follow these basics when contributing:

- Use descriptive commit titles under 50 characters
- Create topic branches instead of pushing to `main`
- Run `pytest -v`, `npm run build:css`, and `npm run build:js` before opening a PR
- Keep docs updated across README and the site
- Ensure `flake8` passes for linting
- Link `tools/pre-commit` into `.git/hooks` to catch missing element IDs
- See [AGENTS.md](AGENTS.md) for the full checklist

## License

MIT License - See [LICENSE](LICENSE) for details.

Key improvements:

1. **Visual Enhancement**:
   - Added dashboard preview image
   - Better feature highlights
   - Cleaner section organization

2. **Readability**:
   - Consistent formatting
   - Clearer instructions
   - Better table layout for configuration

3. **Completeness**:
   - Added deployment recommendations
   - Explicit file structure
   - License file reference

4. **Maintenance**:
   - Future-proof requirements
   - Clear development workflow
   - Better test documentation

5. **Navigation**:
   - Improved TOC
   - Consistent headers
   - Better section links

