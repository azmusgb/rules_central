from extensions import db
from flask_login import UserMixin


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)

    def get_id(self):
        return str(self.id)


class Diagram(db.Model):
    __tablename__ = 'diagrams'

    id = db.Column(db.Integer, primary_key=True)
    root_name = db.Column(db.String(100), index=True)
    name = db.Column(db.String(100), index=True)
    content = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(),
                           onupdate=db.func.current_timestamp())

    user = db.relationship('User', backref='diagrams')
