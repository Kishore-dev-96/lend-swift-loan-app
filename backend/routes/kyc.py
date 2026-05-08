from flask import Blueprint, jsonify, request

from ..routes.decorators import require_auth, require_csrf_token
from ..services.file_service import cleanup_files, save_upload
from ..services.ocr_service import extract_profile
from ..services.user_service import (
    build_user_response,
    get_user_by_id,
    record_activity,
    update_user_profile,
)
from ..utils.security import encrypt_pan
from ..utils.validators import validate_aadhaar_masked, validate_pan

kyc_bp = Blueprint("kyc", __name__, url_prefix="/api/kyc")


@kyc_bp.route("/upload", methods=["POST"])
@require_auth
@require_csrf_token
def upload_kyc_documents():
    aadhaar_file = request.files.get("aadhaar_file")
    pan_file = request.files.get("pan_file")
    if not aadhaar_file or not pan_file:
        return jsonify({"error": "Aadhaar and PAN documents are required."}), 400

    saved_files = []
    try:
        aadhaar_path = save_upload(aadhaar_file)
        pan_path = save_upload(pan_file)
        saved_files.extend([aadhaar_path, pan_path])

        extracted = extract_profile(aadhaar_path, pan_path)
        if not extracted["pan_number"] or not validate_pan(extracted["pan_number"]):
            return jsonify({"error": "Incorrect PAN format."}), 422
        if not extracted["aadhaar_last4"] or not validate_aadhaar_masked(extracted["masked_aadhaar_number"]):
            return jsonify({"error": "Unable to read Aadhaar number."}), 422

        user_id = int(request.user["sub"])
        update_user_profile(
            user_id,
            {
                "name": extracted["name"],
                "dob": extracted["dob"],
                "address": extracted["address"],
                "aadhaar_last4": extracted["aadhaar_last4"],
                "pan_encrypted": encrypt_pan(extracted["pan_number"]),
                "pan_last4": extracted["pan_number"][-4:],
                "profile_status": "partial",
            },
        )
        record_activity(user_id, "kyc_upload", request.remote_addr)

        profile = build_user_response(get_user_by_id(user_id))
        profile["masked_aadhaar_number"] = extracted["masked_aadhaar_number"]
        profile["pan_number"] = extracted["pan_number"]
        profile["confidence"] = extracted.get("confidence", 0)

        return jsonify({"message": "Document upload successful.", "profile": profile}), 200
    finally:
        cleanup_files(saved_files)


@kyc_bp.route("/confirm", methods=["POST"])
@require_auth
@require_csrf_token
def confirm_profile():
    payload = request.get_json(silent=True) or {}
    user_id = int(request.user["sub"])
    pan_number = (payload.get("pan_number") or "").strip().upper()
    masked_aadhaar = (payload.get("masked_aadhaar_number") or "").strip()
    if not validate_pan(pan_number):
        return jsonify({"error": "Invalid PAN format."}), 400
    if not validate_aadhaar_masked(masked_aadhaar):
        return jsonify({"error": "Aadhaar number must be masked as XXXX-XXXX-1234."}), 400

    update_user_profile(
        user_id,
        {
            "name": payload.get("name"),
            "dob": payload.get("dob"),
            "address": payload.get("address"),
            "aadhaar_last4": masked_aadhaar[-4:],
            "pan_encrypted": encrypt_pan(pan_number),
            "pan_last4": pan_number[-4:],
            "profile_status": "partial",
        },
    )
    record_activity(user_id, "kyc_confirm", request.remote_addr)
    return jsonify({"message": "Profile updated successfully."}), 200


@kyc_bp.route("/draft", methods=["GET"])
@require_auth
def get_draft_profile():
    user_id = int(request.user["sub"])
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Profile not found."}), 404
    profile = build_user_response(user)
    return jsonify({"profile": profile}), 200
