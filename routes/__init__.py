from .core import (
    api,
    analytics_routes,
    auth,
    collab,
    diagrams,
    main,
    upload,
    user_routes,
)
from all_routes import routes_bp

# Register routes_bp first to avoid shadowing of /api/* endpoints
all_blueprints = [
    routes_bp,
    analytics_routes,
    user_routes,
    auth,
    upload,
    api,
    diagrams,
    main,
    collab,
]
