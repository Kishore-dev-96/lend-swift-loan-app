from flask import Blueprint, jsonify, make_response, request

from ..config import (
    CSRF_COOKIE_NAME,
    JWT_COOKIE_NAME,
    JWT_EXPIRATION_SECONDS,
)
from ..services.otp_service import send_login_otp, verify_login_otp
from ..services.user_service import (
    build_user_response,
    create_user,
    get_user_by_email,
    get_user_by_mobile,
    increment_failed_login,
    is_account_locked,
    record_activity,
    reset_login_failures,
)
from ..utils.csrf import require_csrf
from ..utils.security import (
    generate_csrf_token,
    generate_jwt,
    hash_password,
    verify_password,
)
from ..utils.validators import validate_email, validate_mobile, validate_password

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_user_token_response(user):
    token = generate_jwt({"sub": user["id"], "email": user["email"]})
    csrf_token = generate_csrf_token()
    response = make_response(
        jsonify({"message": "Authenticated", "user": build_user_response(user)})
    )
    response.set_cookie(
        JWT_COOKIE_NAME,
        token,
        httponly=True,
        samesite="Lax",
        secure=False,
        max_age=JWT_EXPIRATION_SECONDS,
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf_token,
        httponly=False,
        samesite="Lax",
        secure=False,
        max_age=JWT_EXPIRATION_SECONDS,
        path="/",
    )
    return response


@auth_bp.route("/csrf-token", methods=["GET"])
def csrf_token():
    csrf_token = generate_csrf_token()
    response = make_response(jsonify({"csrf_token": csrf_token}))
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf_token,
        httponly=False,
        samesite="Lax",
        secure=False,
        max_age=JWT_EXPIRATION_SECONDS,
        path="/",
    )
    return response


@auth_bp.route("/register", methods=["POST"])
def register():
    if not require_csrf(request):
        return jsonify({"error": "Missing or invalid CSRF token."}), 403

    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""
    name = (payload.get("name") or "").strip() or None

    if not validate_email(email):
        return jsonify({"error": "Invalid email address."}), 400
    is_valid, message = validate_password(password)
    if not is_valid:
        return jsonify({"error": message}), 400

    if get_user_by_email(email):
        return jsonify({"error": "Email already registered."}), 409

    user_id = create_user(name, email, hash_password(password))
    user = get_user_by_email(email)
    record_activity(user_id, "register", request.remote_addr)
    return _get_user_token_response(user)


@auth_bp.route("/login", methods=["POST"])
def login():
    if not require_csrf(request):
        return jsonify({"error": "Missing or invalid CSRF token."}), 403

    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not validate_email(email):
        return jsonify({"error": "Invalid email address."}), 400

    user = get_user_by_email(email)
    if not user or not user["password_hash"]:
        return jsonify({"error": "Invalid credentials."}), 401

    if is_account_locked(user):
        return jsonify({"error": "Account temporarily locked due to multiple failed login attempts."}), 403

    if verify_password(password, user["password_hash"]):
        reset_login_failures(user["id"])
        record_activity(user["id"], "login", request.remote_addr)
        return _get_user_token_response(user)

    increment_failed_login(user["id"])
    return jsonify({"error": "Invalid credentials."}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    if not require_csrf(request):
        return jsonify({"error": "Missing or invalid CSRF token."}), 403
    response = make_response(jsonify({"message": "Logged out."}))
    response.set_cookie(JWT_COOKIE_NAME, "", expires=0, path="/")
    response.set_cookie(CSRF_COOKIE_NAME, "", expires=0, path="/")
    return response


@auth_bp.route("/status", methods=["GET"])
def status():
    from ..utils.security import verify_jwt

    token = request.cookies.get("lend_sft_token")
    if not token:
        return jsonify({"authenticated": False}), 200
    payload = verify_jwt(token)
    if not payload:
        return jsonify({"authenticated": False}), 200
    return jsonify({"authenticated": True, "user": payload}), 200


@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    if not require_csrf(request):
        return jsonify({"error": "Missing or invalid CSRF token."}), 403
    payload = request.get_json(silent=True) or {}
    mobile = (payload.get("mobile") or "").strip()
    if not validate_mobile(mobile):
        return jsonify({"error": "Invalid mobile number."}), 400

    user = get_user_by_mobile(mobile)
    if not user:
        return jsonify({"error": "No account found for this mobile."}), 404

    try:
        result = send_login_otp(mobile, request.remote_addr)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 429

    return jsonify({"message": "OTP sent.", **result}), 200


@auth_bp.route("/mobile-login", methods=["POST"])
def mobile_login():
    if not require_csrf(request):
        return jsonify({"error": "Missing or invalid CSRF token."}), 403
    payload = request.get_json(silent=True) or {}
    mobile = (payload.get("mobile") or "").strip()
    otp = (payload.get("otp") or "").strip()

    if not validate_mobile(mobile) or not otp:
        return jsonify({"error": "Invalid mobile or OTP."}), 400

    user = get_user_by_mobile(mobile)
    if not user:
        return jsonify({"error": "No account found for this mobile."}), 404

    try:
        verify_login_otp(mobile, otp, request.remote_addr)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    record_activity(user["id"], "mobile_login", request.remote_addr)
    return _get_user_token_response(user)
