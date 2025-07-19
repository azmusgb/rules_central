"""Initialize and configure core Flask extensions.

This module instantiates Flask extensions that will be initialized with the Flask
application in the application factory (typically in ``app.py``). The extensions
are made available through the ``__all__`` list for easy importing.
"""

from typing import Optional, Union
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from models import User

__all__ = ["db", "login_manager", "migrate"]

# Core extensions instantiation
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()


@login_manager.user_loader
def load_user(user_id: Union[str, int]) -> Optional[User]:
    """Retrieve a user by their ID for Flask-Login session management.
    
    Args:
        user_id: The user's identifier, which can be a string or integer.
        
    Returns:
        User instance if found and ID is valid, None otherwise.
        
    Note:
        Invalid user IDs are logged at debug level as they should be rare
        and non-fatal events in normal application operation.
    """
    try:
        return User.query.get(int(user_id))
    except (ValueError, TypeError) as e:
        login_manager.logger.debug(
            "Invalid user ID '%s': %s", 
            user_id, 
            str(e)
        )
        return None