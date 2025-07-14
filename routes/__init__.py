from .auth import auth
from .upload import upload
from .api import api
from .diagrams import diagrams
from .main import main
from .collab import collab
from .analytics_routes import analytics_routes
from .user_routes import user_routes

# Import metrics routes so they register with the API blueprint
from . import metrics_api  # noqa: F401
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
