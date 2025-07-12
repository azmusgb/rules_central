import importlib
import os
import sys
import types


# Ensure project root is on the import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def test_create_app_without_dotenv(monkeypatch):
    """``create_app`` should still work when ``python-dotenv`` is absent."""
    monkeypatch.setitem(sys.modules, "dotenv", None)

    flask_stub = types.ModuleType("flask")
    flask_stub.current_app = types.SimpleNamespace()
    flask_stub.render_template = lambda *a, **k: ""

    class FlaskStub:
        def __init__(self, name, static_folder=None, static_url_path=None):
            self.static_folder = static_folder
            self.static_url_path = static_url_path
            self.config = {}
            self.secret_key = None
            self.logger = types.SimpleNamespace(info=lambda *a, **k: None)
            self.root_path = os.getcwd()
            self.jinja_env = types.SimpleNamespace(globals={})

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

    module = importlib.reload(importlib.import_module("app"))
    app = module.create_app()
    assert app.config["VERSION"] == "1.0.0"
