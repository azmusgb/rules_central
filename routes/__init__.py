"""Blueprint registration helpers for :mod:`rules_central`.

This module exposes a single list, :data:`all_blueprints`, which controls the
registration order used by :func:`app.create_app`.  The order matters because
``routes_bp`` contains simple API endpoints that should take precedence over the
more specific blueprints imported from :mod:`routes.core`.
"""

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

__all__ = ["all_blueprints"]

# ``routes_bp`` must be registered first so that its ``/api/*`` routes aren't
# shadowed by the blueprints that follow.
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
