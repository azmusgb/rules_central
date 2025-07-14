"""Authentication routes."""

from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
    request,
    redirect,
    url_for,
    flash,
)

auth = Blueprint("auth", __name__)


@auth.route("/login", methods=["GET", "POST"])
def login():
    """Render the login page and handle submissions."""

    try:
        if request.method == "POST":
            # Placeholder authentication logic
            flash("Logged in successfully!", "success")
            return redirect(url_for("main.index"))

        return render_template("auth/login.html")
    except Exception as exc:
        current_app.logger.error("Login route error: %s", exc)
        return jsonify(error="Login failure"), 500


@auth.route("/register", methods=["GET", "POST"])
def register():
    """Render the registration page and handle submissions."""

    try:
        if request.method == "POST":
            flash("Account created!", "success")
            return redirect(url_for("auth.login"))

        return render_template("auth/register.html")
    except Exception as exc:
        current_app.logger.error("Register route error: %s", exc)
        return jsonify(error="Registration failure"), 500


@auth.route("/logout")
def logout():
    """Log the user out and redirect to the login page."""

    try:
        flash("Logged out successfully!", "success")
        return redirect(url_for("auth.login"))
    except Exception as exc:
        current_app.logger.error("Logout route error: %s", exc)
        return jsonify(error="Logout failure"), 500
