# routes/api.py
from flask import Blueprint, jsonify

api = Blueprint('api', __name__)

@api.route('/api/catalog_names')
def catalog_names():
    # Replace with your actual catalog names source
    names = ['Catalog1', 'Catalog2', 'Catalog3']
    return jsonify(names)
