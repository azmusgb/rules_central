"""Database models for the Rules Central application.

This module defines the core SQLAlchemy models for the application:
- User: Represents authenticated users of the system
- Diagram: Stores diagram metadata and content with ownership relationships
"""

from datetime import datetime
from typing import List, Optional

from flask_login import UserMixin

from extensions import db

__all__ = ["User", "Diagram"]


class User(db.Model, UserMixin):
    """Application user model representing authenticated users.

    Attributes:
        id: Primary key user identifier
        username: Unique username for login
        email: Unique email address
        password_hash: Hashed password storage
        is_active: Flag indicating active status
        diagrams: Relationship to associated diagrams (backref)
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def get_id(self) -> str:
        """Return the user's ID as a string for Flask-Login compatibility.

        Returns:
            String representation of the user's primary key.
        """
        return str(self.id)

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}'>"


class Diagram(db.Model):
    """Stored diagram metadata and content with ownership tracking.

    Attributes:
        id: Primary key diagram identifier
        root_name: Base name for the diagram (indexed)
        name: Display name for the diagram (indexed)
        content: Diagram content storage (text format)
        user_id: Foreign key to owning user
        created_at: Timestamp of creation
        updated_at: Timestamp of last update (auto-updated)
        user: Relationship to owning User
    """

    __tablename__ = "diagrams"

    id = db.Column(db.Integer, primary_key=True)
    root_name = db.Column(db.String(100), index=True, nullable=False)
    name = db.Column(db.String(100), index=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(
        db.DateTime, default=db.func.current_timestamp(), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
        nullable=False,
    )

    # Relationship configuration
    user = db.relationship("User", backref=db.backref("diagrams", lazy="dynamic"))

    def __repr__(self) -> str:
        return f"<Diagram id={self.id} name='{self.name}' user_id={self.user_id}>"
