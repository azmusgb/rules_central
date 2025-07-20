import importlib
import os
import sys
import types

flask_stub = types.ModuleType("flask")
flask_stub.current_app = types.SimpleNamespace()
flask_stub.render_template = lambda *a, **k: ""
flask_stub.jsonify = lambda **k: k
render_template = flask_stub.render_template

class FlaskStub:
    def __init__(self, name, static_folder=None, static_url_path=None, **_):
        self.static_folder = static_folder
        self.static_url_path = static_url_path
        class ConfigDict(dict):
            def from_mapping(self, m):
                self.update(m)
            def from_pyfile(self, f):
                self.update({})
        self.config = ConfigDict()
        self.secret_key = None
        self.logger = types.SimpleNamespace(info=lambda *a, **k: None, warning=lambda *a, **k: None)
        self.root_path = os.getcwd()
        self.instance_path = os.getcwd()
        self.jinja_env = types.SimpleNamespace(globals={})
        self.env = "development"
        self.debug = False

    def template_filter(self, _name):
        def decorator(fn):
            return fn

        return decorator

    def context_processor(self, fn):
        return fn

    def app_context(self):
        class Ctx:
            def __enter__(self_):
                return self_

            def __exit__(self_, exc_type, exc, tb):
                pass

        return Ctx()

    def register_blueprint(self, _bp):
        pass

flask_stub.Flask = FlaskStub
sys.modules["flask"] = flask_stub
routes_stub = types.ModuleType("routes")
routes_stub.all_blueprints = []
sys.modules["routes"] = routes_stub
flask_assets_stub = types.ModuleType("flask_assets")
flask_assets_stub.Environment = lambda app: None
sys.modules["flask_assets"] = flask_assets_stub
flask_wtf_stub = types.ModuleType("flask_wtf")
flask_wtf_stub.CSRFProtect = lambda: types.SimpleNamespace(init_app=lambda app: None)
sys.modules["flask_wtf"] = flask_wtf_stub
flask_wtf_csrf_stub = types.ModuleType("flask_wtf.csrf")
flask_wtf_csrf_stub.generate_csrf = lambda: "csrf-token"
sys.modules["flask_wtf.csrf"] = flask_wtf_csrf_stub
markdown_stub = types.ModuleType("markdown")
markdown_stub.markdown = lambda text: text
sys.modules["markdown"] = markdown_stub
os.environ["RC_SKIP_CREATE_APP"] = "1"


def create_app():
    module = importlib.import_module('app')
    for fn in ["_register_blueprints", "_configure_logging", "_init_extensions", "_ensure_directories", "_register_error_handlers", "_init_security", "_init_template_helpers", "_register_cli"]:
        setattr(module, fn, lambda app=None: None)
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

