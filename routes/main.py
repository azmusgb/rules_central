from flask import Blueprint, render_template

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/catalog')
def catalog():
    return render_template('catalog.html')

@main.route('/search')
def search():
    return render_template('search.html')