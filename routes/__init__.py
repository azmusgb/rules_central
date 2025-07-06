from .auth import auth
from .upload import upload
from .api import api
from .diagrams import diagrams
from .main import main
from .collab import collab
from .metrics_api import *
from all_routes import routes_bp

# Register routes_bp first to avoid shadowing of /api/* endpoints
all_blueprints = [routes_bp, auth, upload, api, diagrams, main, collab]
