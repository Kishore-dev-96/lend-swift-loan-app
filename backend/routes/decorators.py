from functools import wraps

from flask import request, jsonify

from ..utils.csrf import require_csrf
from ..utils.security import verify_jwt
from ..config import JWT_COOKIE_NAME


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = request.cookies.get(JWT_COOKIE_NAME)
        if not token:
            return jsonify({"error": "Authentication required."}), 401
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token."}), 401
        request.user = payload
        return func(*args, **kwargs)
    return wrapper


def require_csrf_token(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not require_csrf(request):
            return jsonify({"error": "Missing or invalid CSRF token."}), 403
        return func(*args, **kwargs)
    return wrapper
