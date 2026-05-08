from flask import Blueprint, jsonify, request

from ..routes.decorators import require_auth
from ..services.user_service import build_user_response, get_user_by_id, record_activity

user_bp = Blueprint("user", __name__, url_prefix="/api/user")


@user_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    user_id = int(request.user["sub"])
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    record_activity(user_id, "profile_view", request.remote_addr)
    return jsonify({"user": build_user_response(user)}), 200
