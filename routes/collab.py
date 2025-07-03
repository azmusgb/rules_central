from flask import Blueprint

collab = Blueprint('collab', __name__)

@collab.route('/collab')
def collab_index():
    return "Collaboration Home"