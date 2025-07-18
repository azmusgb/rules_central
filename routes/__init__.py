"""Blueprint registration and ordering for Rules Central application.

This module defines the registration order for all application blueprints.
The order is important because Flask uses first-match routing, so more specific
routes should be registered before catch-all routes.

The main export is `ALL_BLUEPRINTS` which should be used by the application factory.
"""

from typing import List, TypeVar
from flask import Blueprint

# Import all blueprint modules
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

# Type variable for blueprints
BlueprintT = TypeVar('BlueprintT', bound=Blueprint)

__all__ = ['ALL_BLUEPRINTS', 'all_blueprints']

# Blueprints must be registered in order of most specific to least specific
# to prevent route shadowing. The routes_bp contains core API endpoints that
# should take precedence over other blueprints.
ALL_BLUEPRINTS: List[BlueprintT] = [
    # 1. Core API routes (most specific)
    routes_bp,
    
    # 2. Analytics endpoints
    analytics_routes,
    
    # 3. User management routes
    user_routes,
    
    # 4. Authentication routes
    auth,
    
    # 5. File upload handling
    upload,
    
    # 6. General API endpoints
    api,
    
    # 7. Diagram-specific routes
    diagrams,
    
    # 8. Main application routes
    main,
    
    # 9. Collaboration features (least specific)
    collab,
]

# Backwards‑compat alias expected by app.py
all_blueprints: List[BlueprintT] = ALL_BLUEPRINTS