"""Blueprint registration and ordering for Rules Central application.

This module defines the registration order for all application blueprints.
The order is important because Flask uses first-match routing, so more specific
routes should be registered before catch-all routes.

The main export is `ALL_BLUEPRINTS` which should be used by the application factory.
"""

from typing import List, TypeVar
from flask import Blueprint


BlueprintT = TypeVar("BlueprintT", bound=Blueprint)

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


ALL_BLUEPRINTS: List[BlueprintT] = [
    user_routes,
    auth,
    upload,
    api,
    diagrams,
    main,
    collab,
    ui_routes,
]

__all__ = ["ALL_BLUEPRINTS", "all_blueprints"]


all_blueprints: List[BlueprintT] = ALL_BLUEPRINTS