from .auth import auth
from .upload import upload
from .api import api
from .diagrams import diagrams
from .main import main
from .collab import collab
from .analytics_routes import analytics_routes
from .user_routes import user_routes

from .metrics_api import *
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
