"""Flask extension initialization module."""

from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate

# Instantiate the core extensions. These will be initialized with the Flask
# application in the factory defined in ``app.py``.
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

@login_manager.user_loader
def load_user(user_id: str | int):
    """Return the user instance associated with ``user_id``."""

    from models import User

    try:
        return User.query.get(int(user_id))
    except (ValueError, TypeError):
        # Log at debug level since invalid IDs should be rare and non-fatal
        login_manager.logger.debug("Invalid user id: %s", user_id)
        return None
