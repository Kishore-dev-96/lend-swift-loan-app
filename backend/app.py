import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS

from .config import BASE_DIR, CORS_ORIGINS
from .database import init_db
from .routes.auth import auth_bp
from .routes.kyc import kyc_bp
from .routes.user import user_bp
from .routes.pages import pages_bp


def create_app():
    frontend_dir = Path(BASE_DIR.parent / "frontend")
    app = Flask(
        __name__,
        static_folder=str(frontend_dir),
        static_url_path="",
    )
    app.config.from_object("backend.config")
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
    CORS(
        app,
        supports_credentials=True,
        origins=CORS_ORIGINS,
        allow_headers=["Content-Type", "X-CSRF-Token"],
        expose_headers=["X-CSRF-Token"],
    )

    init_db()

    app.register_blueprint(auth_bp)
    app.register_blueprint(kyc_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(pages_bp)

    @app.route("/")
    def index():
        return app.send_static_file("login.html")

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=()"
        return response

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {"error": "Uploaded file is too large."}, 413

    return app
