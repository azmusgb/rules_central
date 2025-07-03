from flask import Blueprint

diagrams = Blueprint('diagrams', __name__)

@diagrams.route('/diagrams')
def diagrams_index():
    return "Diagrams Home"
