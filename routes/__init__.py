"""Blueprint registration and ordering for Rules Central application.

This module defines the registration order for all application blueprints.
The order is important because Flask uses first-match routing, so more specific
routes should be registered before catch-all routes.

The main export is `ALL_BLUEPRINTS` which should be used by the application factory.
"""

from typing import List, TypeVar
from flask import Blueprint

from typing import List, TypeVar
from flask import Blueprint

# Type variable for blueprints
BlueprintT = TypeVar('BlueprintT', bound=Blueprint)

# Import all blueprint modules
from .core import (
    api,
    auth,
    collab,
    diagrams,
    main,
    upload,
    user_routes,
    ui_routes,
)

# Blueprints must be registered in order of most specific to least specific
# to prevent route shadowing. Core routes should come first.
ALL_BLUEPRINTS: List[BlueprintT] = [
    # 1. User management routes
    user_routes,

    # 2. Authentication routes
    auth,

    # 3. File upload handling
    upload,

    # 4. General API endpoints
    api,

    # 5. Diagram-specific routes
    diagrams,

    # 6. Main application routes
    main,

    # 7. Collaboration features (least specific)
    collab,

    # 8. UI-only routes
    ui_routes,
]

# Type variable for blueprints
BlueprintT = TypeVar('BlueprintT', bound=Blueprint)

__all__ = ['ALL_BLUEPRINTS', 'all_blueprints']

# Blueprints must be registered in order of most specific to least specific
# to prevent route shadowing. Core routes should come first.
ALL_BLUEPRINTS: List[BlueprintT] = [
    # 1. User management routes
    user_routes,

    # 2. Authentication routes
    auth,

    # 3. File upload handling
    upload,

    # 4. General API endpoints
    api,

    # 5. Diagram-specific routes
    diagrams,

    # 6. Main application routes
    main,

    # 7. Collaboration features (least specific)
    collab,
]

# Backwards‑compat alias expected by app.py
all_blueprints: List[BlueprintT] = ALL_BLUEPRINTS