import importlib
from flask import render_template

def create_app():
    module = importlib.import_module('app')
    return module.create_app()

def test_templates_render():
    app = create_app()
    templates = [
        'dashboard.html',
        'upload.html',
        'search.html',
        'rule_detail.html',
        'about.html',
        'auth/login.html',
        'auth/register.html',
        'errors/404.html',
        'errors/500.html',
    ]
    with app.app_context():
        for tmpl in templates:
            render_template(tmpl)

